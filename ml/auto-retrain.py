#!/usr/bin/env python3
"""
Automated ML Model Retraining System

Monitors model performance, data drift, and triggers retraining when needed.
Supports scheduled retraining, performance-based triggers, and manual triggers.
"""

import argparse
import json
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Optional
import hashlib
import subprocess
import time


@dataclass
class RetrainConfig:
    """Configuration for automated retraining."""
    model_name: str
    schedule: str = "0 2 * * *"  # Cron schedule (default: 2 AM daily)
    performance_threshold: float = 0.85
    drift_threshold: float = 0.05
    min_samples_for_retrain: int = 1000
    max_retrain_interval_hours: int = 168  # 1 week
    cooldown_hours: int = 24
    notification_webhook: Optional[str] = None
    storage_path: str = "ml/retrain"


@dataclass
class RetrainTrigger:
    """Records why retraining was triggered."""
    trigger_type: str  # scheduled, performance, drift, manual
    timestamp: str
    reason: str
    details: dict[str, Any] = field(default_factory=dict)
    previous_model_version: Optional[str] = None


class DataDriftDetector:
    """Detects data drift using statistical methods."""

    def __init__(self, reference_data_path: str, current_data_path: str):
        self.reference_path = Path(reference_data_path)
        self.current_path = Path(current_data_path)

    def compute_drift_score(self) -> dict[str, float]:
        """
        Compute drift scores using population stability index (PSI)
        and other statistical measures.
        """
        try:
            import pandas as pd
            import numpy as np
            from scipy import stats

            # Load data
            reference = pd.read_parquet(self.reference_path)
            current = pd.read_parquet(self.current_path)

            drift_scores = {}

            for col in reference.columns:
                if reference[col].dtype in [np.float64, np.int64]:
                    # Compute PSI for numeric columns
                    psi = self._calculate_psi(
                        reference[col].dropna(),
                        current[col].dropna()
                    )
                    drift_scores[col] = psi

                    # KS test
                    ks_stat, ks_pval = stats.ks_2samp(
                        reference[col].dropna(),
                        current[col].dropna()
                    )
                    drift_scores[f"{col}_ks_stat"] = ks_stat
                    drift_scores[f"{col}_ks_pval"] = ks_pval

                else:
                    # Chi-squared test for categorical columns
                    ref_counts = reference[col].value_counts(normalize=True)
                    cur_counts = current[col].value_counts(normalize=True)

                    # Compute chi-squared
                    all_cats = set(ref_counts.index) | set(cur_counts.index)
                    ref_expected = [ref_counts.get(c, 0) for c in all_cats]
                    cur_observed = [cur_counts.get(c, 0) for c in all_cats]

                    chi2 = sum((o - e) ** 2 / (e + 1e-10) for o, e in zip(cur_observed, ref_expected))
                    drift_scores[f"{col}_chi2"] = chi2

            return drift_scores

        except ImportError:
            print("Warning: pandas/numpy/scipy not installed, using basic drift detection")
            return self._basic_drift_check()

    def _calculate_psi(
        self,
        expected: "np.ndarray",
        actual: "np.ndarray",
        buckets: int = 10
    ) -> float:
        """Calculate Population Stability Index."""
        try:
            import numpy as np

            # Create buckets
            breakpoints = np.percentile(expected, np.linspace(0, 100, buckets + 1))

            expected_counts = np.histogram(expected, breakpoints)[0]
            actual_counts = np.histogram(actual, breakpoints)[0]

            # Calculate proportions
            expected_prop = expected_counts / len(expected)
            actual_prop = actual_counts / len(actual)

            # Add small value to avoid division by zero
            expected_prop = np.where(expected_prop == 0, 1e-4, expected_prop)
            actual_prop = np.where(actual_prop == 0, 1e-4, actual_prop)

            # Calculate PSI
            psi = np.sum(
                (actual_prop - expected_prop) * np.log(actual_prop / expected_prop)
            )

            return float(psi)

        except Exception:
            return 0.0

    def _basic_drift_check(self) -> dict[str, float]:
        """Basic drift check without statistical libraries."""
        return {"drift_detected": 0.0}


class PerformanceMonitor:
    """Monitors model performance metrics."""

    def __init__(self, metrics_history_path: str):
        self.metrics_path = Path(metrics_history_path)
        self.metrics_path.parent.mkdir(parents=True, exist_ok=True)

    def get_current_metrics(self) -> dict[str, float]:
        """Get current model performance metrics from monitoring system."""
        # In production, this would query Prometheus, Grafana, or similar
        # For now, return from local file if exists
        if self.metrics_path.exists():
            with open(self.metrics_path) as f:
                return json.load(f)
        return {}

    def record_metrics(
        self,
        metrics: dict[str, float],
        timestamp: Optional[str] = None
    ):
        """Record metrics for historical tracking."""
        if timestamp is None:
            timestamp = datetime.utcnow().isoformat()

        history = []
        if self.metrics_path.exists():
            with open(self.metrics_path) as f:
                history = json.load(f)

        history.append({
            "timestamp": timestamp,
            "metrics": metrics
        })

        # Keep last 1000 entries
        history = history[-1000:]

        with open(self.metrics_path, "w") as f:
            json.dump(history, f, indent=2)

    def check_performance_degradation(
        self,
        threshold: float,
        metric_name: str = "accuracy"
    ) -> tuple[bool, Optional[dict[str, Any]]]:
        """
        Check if performance has degraded below threshold.
        Returns (is_degraded, details)
        """
        current = self.get_current_metrics()

        if metric_name not in current:
            return False, None

        value = current[metric_name]
        is_degraded = value < threshold

        details = {
            "metric": metric_name,
            "current_value": value,
            "threshold": threshold,
            "degradation": threshold - value if is_degraded else 0
        }

        return is_degraded, details

    def get_trend(
        self,
        metric_name: str,
        window_hours: int = 24
    ) -> list[float]:
        """Get metric trend over time window."""
        if not self.metrics_path.exists():
            return []

        with open(self.metrics_path) as f:
            history = json.load(f)

        cutoff = datetime.utcnow() - timedelta(hours=window_hours)
        values = []

        for entry in history:
            entry_time = datetime.fromisoformat(entry["timestamp"])
            if entry_time >= cutoff:
                if metric_name in entry["metrics"]:
                    values.append(entry["metrics"][metric_name])

        return values


class AutoRetrain:
    """
    Automated retraining system that monitors models and triggers retraining.
    """

    def __init__(self, config: RetrainConfig):
        self.config = config
        self.config_path = Path(config.storage_path)
        self.config_path.mkdir(parents=True, exist_ok=True)

        self.drift_detector = None  # Initialized when needed
        self.performance_monitor = PerformanceMonitor(
            metrics_history_path=f"{config.storage_path}/metrics_history.json"
        )

    def check_retrain_needed(self) -> tuple[bool, Optional[RetrainTrigger]]:
        """
        Check if retraining is needed based on all criteria.
        Returns (should_retrain, trigger_info)
        """
        # Check cooldown
        if self._in_cooldown():
            return False, None

        # Check scheduled retrain
        trigger = self._check_scheduled()
        if trigger:
            return True, trigger

        # Check performance degradation
        trigger = self._check_performance()
        if trigger:
            return True, trigger

        # Check data drift
        trigger = self._check_drift()
        if trigger:
            return True, trigger

        return False, None

    def _in_cooldown(self) -> bool:
        """Check if we're in cooldown period since last retrain."""
        cooldown_file = self.config_path / "last_retrain.json"

        if not cooldown_file.exists():
            return False

        with open(cooldown_file) as f:
            last_retrain = json.load(f)

        last_time = datetime.fromisoformat(last_retrain["timestamp"])
        cooldown_end = last_time + timedelta(hours=self.config.cooldown_hours)

        return datetime.utcnow() < cooldown_end

    def _check_scheduled(self) -> Optional[RetrainTrigger]:
        """Check if scheduled retrain time has arrived."""
        # For cron-based scheduling, we'd use APScheduler or similar
        # For now, implement simple interval-based scheduling

        schedule_file = self.config_path / "schedule.json"

        if schedule_file.exists():
            with open(schedule_file) as f:
                schedule_data = json.load(f)

            last_check = datetime.fromisoformat(schedule_data["last_check"])
            next_retrain = datetime.fromisoformat(schedule_data["next_retrain"])

            if datetime.utcnow() >= next_retrain:
                return RetrainTrigger(
                    trigger_type="scheduled",
                    timestamp=datetime.utcnow().isoformat(),
                    reason="Scheduled retraining time reached",
                    details={"schedule": self.config.schedule}
                )

        return None

    def _check_performance(self) -> Optional[RetrainTrigger]:
        """Check if performance has degraded."""
        is_degraded, details = self.performance_monitor.check_performance_degradation(
            threshold=self.config.performance_threshold
        )

        if is_degraded:
            return RetrainTrigger(
                trigger_type="performance",
                timestamp=datetime.utcnow().isoformat(),
                reason=f"Performance degraded below {self.config.performance_threshold}",
                details=details
            )

        return None

    def _check_drift(self) -> Optional[RetrainTrigger]:
        """Check if data drift has exceeded threshold."""
        # Get reference and current data paths
        reference_path = os.environ.get("REFERENCE_DATA_PATH", "data/reference")
        current_path = os.environ.get("CURRENT_DATA_PATH", "data/current")

        if not Path(reference_path).exists() or not Path(current_path).exists():
            return None

        self.drift_detector = DataDriftDetector(reference_path, current_path)
        drift_scores = self.drift_detector.compute_drift_score()

        # Check if any critical drift score exceeds threshold
        max_drift = max(drift_scores.values()) if drift_scores else 0

        if max_drift > self.config.drift_threshold:
            return RetrainTrigger(
                trigger_type="drift",
                timestamp=datetime.utcnow().isoformat(),
                reason=f"Data drift detected (max: {max_drift:.4f} > {self.config.drift_threshold})",
                details=drift_scores
            )

        return None

    def trigger_retrain(
        self,
        trigger: RetrainTrigger,
        dry_run: bool = False
    ) -> dict[str, Any]:
        """
        Trigger model retraining.
        Returns retrain job info.
        """
        # Get current model version
        previous_version = self._get_current_model_version()

        # Record trigger
        trigger.previous_model_version = previous_version
        self._save_trigger(trigger)

        if dry_run:
            return {
                "status": "dry_run",
                "trigger": asdict(trigger),
                "message": "Dry run - no actual retraining performed"
            }

        # Execute retraining
        retrain_result = self._execute_retrain(trigger)

        # Update cooldown
        self._update_cooldown()

        # Send notification
        if self.config.notification_webhook:
            self._send_notification(trigger, retrain_result)

        return {
            "status": "completed",
            "trigger": asdict(trigger),
            "result": retrain_result
        }

    def _get_current_model_version(self) -> Optional[str]:
        """Get current deployed model version."""
        version_file = Path(self.config.storage_path) / "current_version.txt"
        if version_file.exists():
            return version_file.read_text().strip()
        return None

    def _save_trigger(self, trigger: RetrainTrigger):
        """Save trigger information."""
        trigger_file = self.config_path / f"trigger_{trigger.timestamp.replace(':', '-')}.json"
        with open(trigger_file, "w") as f:
            json.dump(asdict(trigger), f, indent=2)

    def _execute_retrain(self, trigger: RetrainTrigger) -> dict[str, Any]:
        """Execute the retraining process."""
        # This would trigger the ML pipeline
        # For now, simulate the execution

        result = {
            "job_id": hashlib.md5(
                f"{trigger.timestamp}:{trigger.trigger_type}".encode()
            ).hexdigest()[:8],
            "trigger": trigger.trigger_type,
            "started_at": datetime.utcnow().isoformat(),
            "status": "running"
        }

        # In production, this would:
        # 1. Create a new training job (K8s job, Airflow DAG, etc.)
        # 2. Monitor the job status
        # 3. Handle failures and rollbacks

        # For demonstration, simulate success
        result["status"] = "completed"
        result["completed_at"] = datetime.utcnow().isoformat()
        result["new_version"] = f"v{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        return result

    def _update_cooldown(self):
        """Update cooldown timestamp."""
        cooldown_file = self.config_path / "last_retrain.json"
        with open(cooldown_file, "w") as f:
            json.dump({
                "timestamp": datetime.utcnow().isoformat(),
                "next_allowed": (
                    datetime.utcnow() + timedelta(hours=self.config.cooldown_hours)
                ).isoformat()
            }, f, indent=2)

    def _send_notification(
        self,
        trigger: RetrainTrigger,
        result: dict[str, Any]
    ):
        """Send notification about retrain event."""
        if not self.config.notification_webhook:
            return

        import urllib.request

        message = {
            "model": self.config.model_name,
            "trigger_type": trigger.trigger_type,
            "status": result.get("status", "unknown"),
            "new_version": result.get("new_version"),
            "timestamp": datetime.utcnow().isoformat()
        }

        try:
            data = json.dumps(message).encode("utf-8")
            req = urllib.request.Request(
                self.config.notification_webhook,
                data=data,
                headers={"Content-Type": "application/json"}
            )
            urllib.request.urlopen(req, timeout=10)
        except Exception as e:
            print(f"Failed to send notification: {e}")

    def update_schedule(self, next_retrain_time: datetime):
        """Update the next scheduled retrain time."""
        schedule_file = self.config_path / "schedule.json"
        with open(schedule_file, "w") as f:
            json.dump({
                "last_check": datetime.utcnow().isoformat(),
                "next_retrain": next_retrain_time.isoformat(),
                "schedule": self.config.schedule
            }, f, indent=2)


def run_monitor_loop(config: RetrainConfig, interval_seconds: int = 300):
    """Run continuous monitoring loop."""
    retrain_system = AutoRetrain(config)

    print(f"Starting auto-retrain monitor for model: {config.model_name}")
    print(f"Performance threshold: {config.performance_threshold}")
    print(f"Drift threshold: {config.drift_threshold}")
    print(f"Cooldown: {config.cooldown_hours} hours")
    print(f"Check interval: {interval_seconds} seconds")

    while True:
        try:
            should_retrain, trigger = retrain_system.check_retrain_needed()

            if should_retrain and trigger:
                print(f"\nRetraining triggered: {trigger.trigger_type}")
                print(f"Reason: {trigger.reason}")

                result = retrain_system.trigger_retrain(trigger)
                print(f"Result: {json.dumps(result, indent=2)}")
            else:
                print(f"[{datetime.utcnow().isoformat()}] No retraining needed")

            time.sleep(interval_seconds)

        except KeyboardInterrupt:
            print("\nMonitor stopped by user")
            break
        except Exception as e:
            print(f"Error in monitor loop: {e}")
            time.sleep(interval_seconds)


def main():
    parser = argparse.ArgumentParser(description="Automated ML Retraining")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # check command
    check_parser = subparsers.add_parser("check", help="Check if retraining is needed")
    check_parser.add_argument("--model", default="intent-classifier")
    check_parser.add_argument("--performance-threshold", type=float, default=0.85)
    check_parser.add_argument("--drift-threshold", type=float, default=0.05)
    check_parser.add_argument("--storage-path", default="ml/retrain")

    # trigger command
    trigger_parser = subparsers.add_parser("trigger", help="Trigger retraining")
    trigger_parser.add_argument("--model", default="intent-classifier")
    trigger_parser.add_argument("--type", default="manual", choices=["manual", "scheduled", "performance", "drift"])
    trigger_parser.add_argument("--dry-run", action="store_true")
    trigger_parser.add_argument("--storage-path", default="ml/retrain")

    # monitor command
    monitor_parser = subparsers.add_parser("monitor", help="Run continuous monitoring")
    monitor_parser.add_argument("--model", default="intent-classifier")
    monitor_parser.add_argument("--performance-threshold", type=float, default=0.85)
    monitor_parser.add_argument("--drift-threshold", type=float, default=0.05)
    monitor_parser.add_argument("--cooldown-hours", type=int, default=24)
    monitor_parser.add_argument("--interval-seconds", type=int, default=300)
    monitor_parser.add_argument("--storage-path", default="ml/retrain")
    monitor_parser.add_argument("--notification-webhook")

    # status command
    status_parser = subparsers.add_parser("status", help="Get retraining status")
    status_parser.add_argument("--model", default="intent-classifier")
    status_parser.add_argument("--storage-path", default="ml/retrain")

    args = parser.parse_args()

    if args.command == "check":
        config = RetrainConfig(
            model_name=args.model,
            performance_threshold=args.performance_threshold,
            drift_threshold=args.drift_threshold,
            storage_path=args.storage_path
        )
        retrain_system = AutoRetrain(config)
        should_retrain, trigger = retrain_system.check_retrain_needed()

        if should_retrain:
            print(f"Retraining needed!")
            print(f"Trigger: {trigger.trigger_type}")
            print(f"Reason: {trigger.reason}")
            print(f"Details: {json.dumps(trigger.details, indent=2)}")
        else:
            print("No retraining needed at this time")

    elif args.command == "trigger":
        config = RetrainConfig(
            model_name=args.model,
            storage_path=args.storage_path
        )
        retrain_system = AutoRetrain(config)

        trigger = RetrainTrigger(
            trigger_type=args.type,
            timestamp=datetime.utcnow().isoformat(),
            reason=f"Manual trigger via CLI"
        )

        result = retrain_system.trigger_retrain(trigger, dry_run=args.dry_run)
        print(json.dumps(result, indent=2))

    elif args.command == "monitor":
        config = RetrainConfig(
            model_name=args.model,
            performance_threshold=args.performance_threshold,
            drift_threshold=args.drift_threshold,
            cooldown_hours=args.cooldown_hours,
            notification_webhook=args.notification_webhook,
            storage_path=args.storage_path
        )
        run_monitor_loop(config, args.interval_seconds)

    elif args.command == "status":
        status_path = Path(args.storage_path)

        status = {
            "model": args.model,
            "last_check": None,
            "last_retrain": None,
            "next_allowed": None,
            "recent_triggers": []
        }

        # Read last retrain info
        cooldown_file = status_path / "last_retrain.json"
        if cooldown_file.exists():
            with open(cooldown_file) as f:
                status.update(json.load(f))

        # Read recent triggers
        triggers_dir = status_path
        if triggers_dir.exists():
            for trigger_file in sorted(triggers_dir.glob("trigger_*.json"), reverse=True)[:5]:
                with open(trigger_file) as f:
                    status["recent_triggers"].append(json.load(f))

        print(json.dumps(status, indent=2))


if __name__ == "__main__":
    main()
