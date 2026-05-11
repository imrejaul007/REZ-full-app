#!/usr/bin/env python3
"""
ML Experiment Tracking System

Tracks experiments, metrics, hyperparameters, and model artifacts.
Supports TensorBoard, MLflow, and custom backends.
"""

import argparse
import json
import os
import sys
from dataclasses import dataclass, asdict, field
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
import hashlib
import subprocess


@dataclass
class Experiment:
    """Represents a single ML experiment."""
    experiment_id: str
    name: str
    git_commit: str
    config: dict[str, Any]
    metrics: dict[str, float] = field(default_factory=dict)
    artifacts: dict[str, str] = field(default_factory=dict)
    status: str = "running"  # running, completed, failed
    started_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    ended_at: Optional[str] = None
    tags: dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class ExperimentTracker:
    """
    Tracks ML experiments with metadata, metrics, and artifacts.
    """

    def __init__(
        self,
        storage_path: str = "ml/experiments",
        backend: str = "local"  # local, mlflow, wandb
    ):
        self.storage_path = Path(storage_path)
        self.backend = backend
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # Initialize backend
        if backend == "mlflow":
            self._init_mlflow()
        elif backend == "wandb":
            self._init_wandb()

    def _init_mlflow(self):
        """Initialize MLflow tracking."""
        try:
            import mlflow
            mlflow.set_tracking_uri(os.environ.get("MLFLOW_TRACKING_URI", "file://ml/mlruns"))
            self.mlflow = mlflow
        except ImportError:
            print("Warning: mlflow not installed, falling back to local storage")
            self.backend = "local"

    def _init_wandb(self):
        """Initialize Weights & Biases."""
        try:
            import wandb
            wandb.init(project="rez-ml", entity=os.environ.get("WANDB_ENTITY"))
            self.wandb = wandb
        except ImportError:
            print("Warning: wandb not installed, falling back to local storage")
            self.backend = "local"

    def _generate_experiment_id(self, config: dict, git_commit: str) -> str:
        """Generate unique experiment ID from config and git commit."""
        config_str = json.dumps(config, sort_keys=True)
        hash_input = f"{git_commit}:{config_str}:{datetime.utcnow().isoformat()}"
        return hashlib.sha256(hash_input.encode()).hexdigest()[:16]

    def log_start(
        self,
        experiment_id: Optional[str] = None,
        name: Optional[str] = None,
        config_path: Optional[str] = None,
        git_commit: Optional[str] = None,
        tags: Optional[dict[str, str]] = None
    ) -> Experiment:
        """Log experiment start."""
        # Load config
        config = {}
        if config_path:
            with open(config_path) as f:
                config = yaml.safe_load(f) if config_path.endswith(('.yaml', '.yml')) else json.load(f)

        # Get git commit if not provided
        if not git_commit:
            try:
                git_commit = subprocess.check_output(
                    ["git", "rev-parse", "HEAD"], text=True
                ).strip()
            except subprocess.CalledProcessError:
                git_commit = "unknown"

        # Generate ID
        if not experiment_id:
            experiment_id = self._generate_experiment_id(config, git_commit)

        # Create experiment
        experiment = Experiment(
            experiment_id=experiment_id,
            name=name or f"exp-{experiment_id}",
            git_commit=git_commit,
            config=config,
            tags=tags or {}
        )

        # Log to backend
        if self.backend == "mlflow":
            self.mlflow.start_run(run_name=experiment_id)
            self.mlflow.log_params(config)
        elif self.backend == "wandb":
            self.wandb.init(
                id=experiment_id,
                name=name,
                config=config,
                tags=list(tags.values()) if tags else None,
                resume=False
            )

        # Save experiment metadata
        self._save_experiment(experiment)

        print(f"Experiment started: {experiment_id}")
        return experiment

    def log_metrics(
        self,
        experiment_id: str,
        metrics: dict[str, float],
        step: Optional[int] = None
    ):
        """Log metrics for an experiment."""
        # Load existing experiment
        experiment = self._load_experiment(experiment_id)
        if not experiment:
            raise ValueError(f"Experiment {experiment_id} not found")

        # Update metrics with timestamp
        timestamp = datetime.utcnow().isoformat()
        for key, value in metrics.items():
            if key not in experiment.metrics:
                experiment.metrics[key] = {}
            experiment.metrics[key][timestamp] = value

        # Log to backend
        if self.backend == "mlflow":
            self.mlflow.log_metrics(metrics, step=step)
        elif self.backend == "wandb":
            self.wandb.log(metrics, step=step)

        # Save updated experiment
        self._save_experiment(experiment)

    def log_artifact(
        self,
        experiment_id: str,
        artifact_name: str,
        artifact_path: str,
        artifact_type: str = "model"
    ):
        """Log an artifact (model, dataset, etc.) for an experiment."""
        experiment = self._load_experiment(experiment_id)
        if not experiment:
            raise ValueError(f"Experiment {experiment_id} not found")

        # Copy artifact to experiments storage
        dest_dir = self.storage_path / experiment_id / "artifacts" / artifact_type
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / artifact_name

        # Handle directory or file
        src_path = Path(artifact_path)
        if src_path.is_dir():
            import shutil
            shutil.copytree(src_path, dest_path, dirs_exist_ok=True)
        else:
            import shutil
            shutil.copy2(src_path, dest_path)

        # Update experiment
        experiment.artifacts[artifact_name] = str(dest_path)
        self._save_experiment(experiment)

        # Log to backend
        if self.backend == "mlflow":
            self.mlflow.log_artifact(str(dest_path), artifact_type)
        elif self.backend == "wandb":
            self.wandb.save(str(dest_path))

    def log_end(
        self,
        experiment_id: str,
        status: str = "completed",
        metrics: Optional[dict[str, float]] = None
    ):
        """Log experiment end."""
        experiment = self._load_experiment(experiment_id)
        if not experiment:
            raise ValueError(f"Experiment {experiment_id} not found")

        experiment.status = status
        experiment.ended_at = datetime.utcnow().isoformat()

        # Update final metrics
        if metrics:
            experiment.metrics.update(metrics)

        # End backend run
        if self.backend == "mlflow":
            self.mlflow.end_run(status=status)
        elif self.backend == "wandb":
            self.wandb.finish(status=status)

        # Save final experiment
        self._save_experiment(experiment)

        # Calculate duration
        start = datetime.fromisoformat(experiment.started_at)
        end = datetime.fromisoformat(experiment.ended_at)
        duration = (end - start).total_seconds()

        print(f"Experiment {experiment_id} ended: {status} (duration: {duration:.1f}s)")
        return experiment

    def _save_experiment(self, experiment: Experiment):
        """Save experiment to storage."""
        exp_dir = self.storage_path / experiment.experiment_id
        exp_dir.mkdir(parents=True, exist_ok=True)

        with open(exp_dir / "experiment.json", "w") as f:
            json.dump(experiment.to_dict(), f, indent=2)

        # Save metrics separately for easier access
        with open(exp_dir / "metrics.json", "w") as f:
            json.dump(experiment.metrics, f, indent=2)

    def _load_experiment(self, experiment_id: str) -> Optional[Experiment]:
        """Load experiment from storage."""
        exp_path = self.storage_path / experiment_id / "experiment.json"
        if not exp_path.exists():
            return None

        with open(exp_path) as f:
            data = json.load(f)
        return Experiment(**data)

    def get_experiment(self, experiment_id: str) -> Optional[Experiment]:
        """Get experiment by ID."""
        return self._load_experiment(experiment_id)

    def list_experiments(
        self,
        status: Optional[str] = None,
        limit: int = 100
    ) -> list[Experiment]:
        """List experiments with optional filtering."""
        experiments = []

        for exp_dir in sorted(self.storage_path.iterdir(), reverse=True):
            if not exp_dir.is_dir():
                continue

            exp = self._load_experiment(exp_dir.name)
            if exp and (status is None or exp.status == status):
                experiments.append(exp)

            if len(experiments) >= limit:
                break

        return experiments

    def compare_experiments(
        self,
        experiment_ids: list[str],
        metrics: Optional[list[str]] = None
    ) -> dict[str, Any]:
        """Compare metrics across experiments."""
        comparison = {
            "experiments": [],
            "metric_names": metrics or []
        }

        for exp_id in experiment_ids:
            exp = self._load_experiment(exp_id)
            if not exp:
                continue

            exp_data = {
                "experiment_id": exp.experiment_id,
                "name": exp.name,
                "git_commit": exp.git_commit,
                "status": exp.status,
                "duration": None
            }

            if exp.ended_at and exp.started_at:
                start = datetime.fromisoformat(exp.started_at)
                end = datetime.fromisoformat(exp.ended_at)
                exp_data["duration"] = (end - start).total_seconds()

            # Extract latest values for each metric
            for metric_name, values in exp.metrics.items():
                if metrics and metric_name not in metrics:
                    continue
                if metric_name not in comparison["metric_names"]:
                    comparison["metric_names"].append(metric_name)

                # Get latest value
                if values:
                    latest_timestamp = max(values.keys())
                    exp_data[f"{metric_name}_latest"] = values[latest_timestamp]

            comparison["experiments"].append(exp_data)

        return comparison

    def export_to_tensorboard(self, experiment_id: str, log_dir: str):
        """Export experiment metrics to TensorBoard format."""
        experiment = self._load_experiment(experiment_id)
        if not experiment:
            raise ValueError(f"Experiment {experiment_id} not found")

        from tensorboard.backend.event_processing import event_accumulator

        # Create TensorBoard log directory
        tb_log_dir = Path(log_dir) / experiment_id
        tb_log_dir.mkdir(parents=True, exist_ok=True)

        # Write events
        try:
            from torch.utils.tensorboard import SummaryWriter
            writer = SummaryWriter(str(tb_log_dir))

            for metric_name, values in experiment.metrics.items():
                for step, (timestamp, value) in enumerate(values.items()):
                    writer.add_scalar(metric_name, value, step)

            writer.close()
            print(f"Exported to TensorBoard: {tb_log_dir}")
        except ImportError:
            print("Error: tensorboard not installed")


def main():
    parser = argparse.ArgumentParser(description="ML Experiment Tracking")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # log-start command
    start_parser = subparsers.add_parser("log-start", help="Log experiment start")
    start_parser.add_argument("--experiment-id", help="Custom experiment ID")
    start_parser.add_argument("--name", help="Experiment name")
    start_parser.add_argument("--config", help="Config file path (JSON/YAML)")
    start_parser.add_argument("--git-commit", help="Git commit hash")
    start_parser.add_argument("--storage-path", default="ml/experiments", help="Storage path")
    start_parser.add_argument("--backend", default="local", choices=["local", "mlflow", "wandb"])

    # log-metrics command
    metrics_parser = subparsers.add_parser("log-metrics", help="Log metrics")
    metrics_parser.add_argument("--experiment-id", required=True)
    metrics_parser.add_argument("--metrics", required=True, help="JSON metrics")
    metrics_parser.add_argument("--step", type=int)
    metrics_parser.add_argument("--storage-path", default="ml/experiments")

    # log-artifact command
    artifact_parser = subparsers.add_parser("log-artifact", help="Log artifact")
    artifact_parser.add_argument("--experiment-id", required=True)
    artifact_parser.add_argument("--name", required=True)
    artifact_parser.add_argument("--path", required=True)
    artifact_parser.add_argument("--type", default="model")
    artifact_parser.add_argument("--storage-path", default="ml/experiments")

    # log-end command
    end_parser = subparsers.add_parser("log-end", help="Log experiment end")
    end_parser.add_argument("--experiment-id", required=True)
    end_parser.add_argument("--status", default="completed")
    end_parser.add_argument("--metrics", help="JSON metrics")
    end_parser.add_argument("--storage-path", default="ml/experiments")

    # list command
    list_parser = subparsers.add_parser("list", help="List experiments")
    list_parser.add_argument("--status", help="Filter by status")
    list_parser.add_argument("--limit", type=int, default=100)
    list_parser.add_argument("--storage-path", default="ml/experiments")

    # compare command
    compare_parser = subparsers.add_parser("compare", help="Compare experiments")
    compare_parser.add_argument("--experiments", required=True, help="Comma-separated IDs")
    compare_parser.add_argument("--metrics", help="Comma-separated metric names")
    compare_parser.add_argument("--storage-path", default="ml/experiments")

    # export command
    export_parser = subparsers.add_parser("export-tensorboard", help="Export to TensorBoard")
    export_parser.add_argument("--experiment-id", required=True)
    export_parser.add_argument("--log-dir", required=True)
    export_parser.add_argument("--storage-path", default="ml/experiments")

    args = parser.parse_args()

    # Initialize tracker
    tracker = ExperimentTracker(
        storage_path=args.storage_path,
        backend=getattr(args, 'backend', 'local')
    )

    # Execute command
    if args.command == "log-start":
        tags = None  # Could parse from args
        exp = tracker.log_start(
            experiment_id=args.experiment_id,
            name=args.name,
            config_path=args.config,
            git_commit=args.git_commit,
            tags=tags
        )
        print(json.dumps(exp.to_dict(), indent=2))

    elif args.command == "log-metrics":
        metrics = json.loads(args.metrics)
        tracker.log_metrics(
            experiment_id=args.experiment_id,
            metrics=metrics,
            step=args.step
        )

    elif args.command == "log-artifact":
        tracker.log_artifact(
            experiment_id=args.experiment_id,
            artifact_name=args.name,
            artifact_path=args.path,
            artifact_type=args.type
        )

    elif args.command == "log-end":
        metrics = json.loads(args.metrics) if args.metrics else None
        exp = tracker.log_end(
            experiment_id=args.experiment_id,
            status=args.status,
            metrics=metrics
        )
        print(json.dumps(exp.to_dict(), indent=2))

    elif args.command == "list":
        exps = tracker.list_experiments(status=args.status, limit=args.limit)
        print(json.dumps([e.to_dict() for e in exps], indent=2))

    elif args.command == "compare":
        exp_ids = args.experiments.split(",")
        metrics = args.metrics.split(",") if args.metrics else None
        comparison = tracker.compare_experiments(exp_ids, metrics)
        print(json.dumps(comparison, indent=2))

    elif args.command == "export-tensorboard":
        tracker.export_to_tensorboard(args.experiment_id, args.log_dir)


if __name__ == "__main__":
    main()
