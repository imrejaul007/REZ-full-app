/**
 * Loop Orchestrator Module
 *
 * Orchestrates the full Inventory → Reorder closed loop flow.
 * Handles failures, routes to approval when needed, and manages the
 * end-to-end lifecycle of reorder events.
 *
 * Flow:
 * 1. Receive inventory.low event from Event Platform
 * 2. Process intent through Intent Graph
 * 3. Make decision through Action Engine
 * 4. Execute: Create draft PO or auto-approve
 * 5. Wait for merchant approval (if required)
 * 6. Record feedback
 * 7. Trigger learning update
 */
import { InventoryLowEvent } from './emitter';
export declare enum LoopState {
    INITIALIZED = "initialized",
    INTENT_PROCESSING = "intent_processing",
    ACTION_DECIDING = "action_deciding",
    EXECUTING = "executing",
    PENDING_APPROVAL = "pending_approval",
    APPROVED = "approved",
    REJECTED = "rejected",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare enum ActionDecision {
    AUTO_APPROVE = "auto_approve",
    DRAFT_FOR_APPROVAL = "draft_for_approval",
    SKIP = "skip",
    MANUAL_REVIEW = "manual_review"
}
export interface LoopContext {
    loopId: string;
    correlationId: string;
    tenantId: string;
    state: LoopState;
    event: InventoryLowEvent;
    intent?: ProcessedIntent;
    decision?: ActionDecision;
    draftOrderId?: string;
    approvalUrl?: string;
    error?: string;
    timestamps: {
        started: string;
        intentProcessed?: string;
        actionDecided?: string;
        executed?: string;
        approved?: string;
        completed?: string;
        failed?: string;
    };
    retryCount: number;
}
export interface ProcessedIntent {
    intentId: string;
    type: 'reorder';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    suggestedQuantity: number;
    supplierId: string;
    estimatedCost: number;
    leadTimeDays: number;
    confidence: number;
}
export interface ActionResult {
    decision: ActionDecision;
    reason: string;
    autoApprove: boolean;
    draftOrderId?: string;
    approvalUrl?: string;
}
export interface ExecutionResult {
    success: boolean;
    draftOrderId?: string;
    approvalUrl?: string;
    error?: string;
}
export interface FeedbackResult {
    success: boolean;
    feedbackId?: string;
    error?: string;
}
export interface OrchestratorConfig {
    intentGraphUrl: string;
    actionEngineUrl: string;
    nextaBizUrl: string;
    nextaBizApiKey: string;
    feedbackServiceUrl: string;
    feedbackServiceToken: string;
    adaptiveAgentUrl: string;
    loopTimeoutMs: number;
    maxRetries: number;
    onStateChange?: (context: LoopContext) => void;
    onError?: (context: LoopContext, error: Error) => void;
    onCompletion?: (context: LoopContext) => void;
}
export declare class LoopOrchestrator {
    private readonly intentGraph;
    private readonly actionEngine;
    private readonly nextaBiz;
    private readonly feedbackService;
    private readonly adaptiveAgent;
    private readonly config;
    private readonly metrics;
    private readonly activeLoops;
    constructor(config: OrchestratorConfig);
    /**
     * Start processing a new inventory.low event through the loop
     */
    startLoop(event: InventoryLowEvent): Promise<LoopContext>;
    /**
     * Execute the full loop flow with error handling and retries
     */
    private executeLoop;
    /**
     * Process intent through the Intent Graph
     */
    private processIntent;
    /**
     * Decide action through the Action Engine
     */
    private decideAction;
    /**
     * Execute the action (create draft or auto-approve)
     */
    private executeAction;
    /**
     * Complete the loop with the given outcome
     */
    private completeWithOutcome;
    /**
     * Handle failure with retries
     */
    private handleFailure;
    /**
     * Complete a loop that was pending approval (called via webhook)
     */
    completeLoop(loopId: string, outcome: 'approved' | 'rejected' | 'modified', merchantFeedback?: string): Promise<LoopContext | null>;
    /**
     * Get current status of a loop
     */
    getLoopStatus(loopId: string): LoopContext | null;
    /**
     * Get all active loops
     */
    getActiveLoops(): LoopContext[];
    /**
     * Get orchestrator metrics
     */
    getMetrics(): Readonly<OrchestratorMetrics>;
    /**
     * Cancel a pending loop
     */
    cancelLoop(loopId: string): boolean;
}
interface OrchestratorMetrics {
    loopsStarted: number;
    loopsCompleted: number;
    loopsFailed: number;
    loopsPendingApproval: number;
    totalDurationMs: number;
    activeLoops?: number;
    avgDurationMs?: number;
}
export declare function createOrchestrator(config: OrchestratorConfig): LoopOrchestrator;
export declare function createEventHandler(orchestrator: LoopOrchestrator): (event: InventoryLowEvent) => Promise<LoopContext>;
declare const _default: {
    LoopOrchestrator: typeof LoopOrchestrator;
    createOrchestrator: typeof createOrchestrator;
    createEventHandler: typeof createEventHandler;
    LoopState: typeof LoopState;
    ActionDecision: typeof ActionDecision;
};
export default _default;
//# sourceMappingURL=loop-orchestrator.d.ts.map