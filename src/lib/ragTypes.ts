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

// AgentPulse API /v1/traces/{trace_id}
export interface SpanEvaluation {
  grounding_score: number | null;
  tool_claim_score: number | null;
  overall_risk_score: number | null;
  label: 'low_risk' | 'medium_risk' | 'high_risk' | string | null;
  evaluation_stage: 'stage1' | 'stage2' | string | null;
}

export interface SpanDetail {
  span_id: string;
  trace_id: string;
  agent_id: string;
  role?: string;
  model?: string;
  latency_ms?: number;
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  input_summary?: string; // Evidence
  output_summary?: string; // Claim
  tool_result_summary?: string; // Tool's real result
  evaluation?: SpanEvaluation | null;
}

export interface ApiTraceAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  agent_id?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
}

export interface TraceDetailResponse {
  trace: {
    id: string;
    pipeline_id?: string;
    status: 'ok' | 'warning' | 'error';
    duration_ms?: number;
    timestamp: string;
    session_id?: string;
  };
  spans: SpanDetail[];
  alerts?: ApiTraceAlert[];
}

// Agent drift from /v1/drift and /v1/agents
export interface AgentDriftInfo {
  agent_id: string;
  agent_name?: string;
  baseline_size: number; // e.g. 14. Gate: 32 spans required for validity
  asi?: number | null;
  centroid_distance?: number | null;
  tool_drift?: number | null;
}

// Platform health from /v1/health/*
export interface PlatformHealth {
  apiReady: boolean;
  evaluatorHealthy: boolean;
  workersAlive: number;
  queueDepth: number;
  lastEvalTime?: string;
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
  latency_ms: number;
}
