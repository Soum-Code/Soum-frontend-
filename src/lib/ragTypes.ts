/**
 * Type contracts for AgentPulse RAG Chat and Live Instrument Panel.
 * Strictly aligned with backend/ and demo/chat_server.py contracts.
 */

export interface ChatAgentRun {
  agent: 'retriever' | 'verifier' | 'answerer' | string;
  model: string;
  output: string;
  latency_ms: number;
}

export interface ChatResponse200 {
  session_id: string;
  trace_id: string;
  reply: string;
  verifier_verdict: string;
  retrieved: string[];
  agents: ChatAgentRun[];
}

export interface ChatResponse502 {
  session_id?: string;
  trace_id?: string;
  error: string;
  agents?: ChatAgentRun[];
  retrieved?: string[];
}

export interface ChatResponse503 {
  session_id?: string;
  error: string;
  agents: [];
}

export interface CorpusResponse {
  documents: string[];
}

export interface ChatServerHealth {
  provider: string;
  base_url: string;
  models: Record<string, string>;
  key_configured: boolean;
  key_env: string;
}

// The shapes below are the backend's, field for field, as recorded in
// src/lib/__fixtures__/backend (see scripts/capture_backend_fixtures.py).
// contract.test.ts fails if an interface and a recorded response disagree.

// AgentPulse API /v1/traces/{trace_id}
export interface SpanEvaluation {
  grounding_score: number | null;
  tool_claim_score: number | null;
  overall_risk_score: number | null;
  label: 'low_risk' | 'medium_risk' | 'high_risk' | string | null;
  // "skipped" when the span had no output to check; the scores are then null.
  evaluation_stage: 'stage1' | 'stage2' | 'skipped' | string | null;
}

export interface SpanDetail {
  span_id: string;
  parent_span_id: string | null;
  agent_id: string;
  agent_role: string | null;
  event_type: string;
  span_kind: string;
  latency_ms: number | null;
  status: 'success' | 'error' | string;
  error_message: string | null;
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  tool_name: string | null;
  tool_args: string | null;
  tool_result_summary: string | null; // Tool's real result
  input_summary: string | null; // Evidence
  output_summary: string | null; // Claim
  start_time: string | null;
  // null until the worker has evaluated the span.
  evaluation: SpanEvaluation | null;
}

// An alert as /v1/alerts and /v1/traces/{id} return it. `id` is an integer and
// the lifecycle is two booleans; severity is the backend's HIGH or MEDIUM.
export interface ApiAlert {
  id: number;
  alert_type: string;
  severity: 'HIGH' | 'MEDIUM' | string;
  message: string;
  agent_id: string | null;
  trace_id: string | null;
  span_id: string | null;
  acknowledged: boolean;
  resolved: boolean;
  created_at: string;
  details: Record<string, unknown> | null;
}

export interface TraceSummary {
  trace_id: string;
  pipeline_id: string | null;
  service_name: string;
  start_time: string | null;
  end_time: string | null;
  // The backend writes "running" and does not update it when the trace ends.
  status: 'running' | 'completed' | 'error' | string;
  total_spans: number;
  overall_risk_score: number | null;
}

export interface TraceDetailResponse {
  trace: TraceSummary;
  spans: SpanDetail[];
  alerts: ApiAlert[];
}

export interface AlertsResponse {
  alerts: ApiAlert[];
}

// GET /v1/drift. ASI is 0-100 (higher is more stable). `baseline_size` is the
// number of samples the agent has contributed so far.
export interface AgentDriftInfo {
  agent_id: string;
  current_asi: number | null;
  // One output against the running centroid: the spike signal, noisy by design.
  latest_centroid_distance: number | null;
  // Baseline window against recent window: the sustained shift, and the value
  // DRIFT_DETECTED alerts are raised on. null until both windows have filled.
  latest_window_centroid_distance: number | null;
  latest_tool_drift: number | null;
  baseline_size: number;
}

export interface DriftResponse {
  agents: AgentDriftInfo[];
}

// GET /v1/health/evaluator. The endpoint answers 503 with this same body when
// no worker is alive.
export interface EvaluatorHealth {
  ready: boolean;
  workers_alive: number;
  workers_registered: number;
  workers_stale: number;
  stale_after_seconds: number;
  backend_distribution: Record<string, number>;
  degraded_workers: number;
  degraded: boolean;
  reasons: string[];
}

// What the monitor view keeps, built from /v1/health/ready and /v1/health/evaluator.
export interface PlatformHealth {
  apiReady: boolean;
  evaluatorHealthy: boolean;
  workersAlive: number;
  // The evaluator endpoint does not report queue depth, so this stays null
  // rather than showing a zero nobody measured.
  queueDepth: number | null;
  errorMessage?: string;
}

// Turn model in the Chat pane
export type TurnStatus = 'running' | 'completed' | 'failed';

export interface ChatTurn {
  id: string;
  session_id: string;
  user_message: string;
  timestamp: string;
  status: TurnStatus;
  trace_id?: string;
  reply?: string;
  verifier_verdict?: string;
  retrieved?: string[];
  agents?: ChatAgentRun[];
  error?: string;
  // Polled trace details from AgentPulse API
  traceDetail?: TraceDetailResponse | null;
  isEvaluating?: boolean;
  evaluationTimeout?: boolean;
}

// WebSocket Live Span message
export interface WsLiveSpanEvent {
  type: 'new_span';
  trace_id: string;
  span_id: string;
  agent_id: string;
  status: string;
  latency_ms: number | null;
}
