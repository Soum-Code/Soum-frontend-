/**
 * Real API client for AgentPulse Chat Service (port 8100) and AgentPulse API (port 8000).
 * 
 * Rules:
 * - NO mock data fallbacks
 * - NO hardcoded corpus list
 * - NO fabricated scores or synthetic answers
 * - Real errors, 502s, and 503s are surfaced directly
 */

import {
  CorpusResponse,
  ChatServerHealth,
  ChatResponse200,
  ChatResponse502,
  TraceDetailResponse,
  PlatformHealth,
  AgentDriftInfo,
  WsLiveSpanEvent
} from './ragTypes';

export const CHAT_SERVER_URL =
  (typeof window !== 'undefined' && (window as any).__AGENTPULSE_CHAT_URL__) ||
  (import.meta as any).env?.VITE_CHAT_SERVER_URL ||
  'http://localhost:8100';

export const AGENTPULSE_API_URL =
  (typeof window !== 'undefined' && (window as any).__AGENTPULSE_API_URL__) ||
  (import.meta as any).env?.VITE_AGENTPULSE_API_URL ||
  'http://localhost:8000';

/**
 * Fetch document titles the retriever can search from GET /corpus
 */
export async function fetchCorpus(signal?: AbortSignal): Promise<{
  documents: string[];
  unreachable?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${CHAT_SERVER_URL}/corpus`, { signal });
    if (!res.ok) {
      return { documents: [], error: `HTTP ${res.status}: Failed to load corpus` };
    }
    const data: CorpusResponse = await res.json();
    return { documents: data.documents || [] };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return {
      documents: [],
      unreachable: true,
      error: `Chat service unreachable at ${CHAT_SERVER_URL}. Start it with: uvicorn demo.chat_server:app --port 8100`
    };
  }
}

/**
 * Fetch Chat Server health from GET /health
 */
export async function fetchChatServerHealth(signal?: AbortSignal): Promise<{
  health?: ChatServerHealth;
  unreachable?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${CHAT_SERVER_URL}/health`, { signal });
    if (!res.ok) {
      return { error: `HTTP ${res.status}: Chat server unhealthy` };
    }
    const health: ChatServerHealth = await res.json();
    return { health };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return {
      unreachable: true,
      error: `Chat service unreachable at ${CHAT_SERVER_URL}`
    };
  }
}

/**
 * Send user message to POST /chat
 * Handles 200, 502, 503 (no credential), 422
 */
export async function sendChatMessage(
  message: string,
  sessionId?: string,
  signal?: AbortSignal
): Promise<{
  status: number;
  data?: ChatResponse200;
  data502?: ChatResponse502;
  error?: string;
  unreachable?: boolean;
}> {
  try {
    const res = await fetch(`${CHAT_SERVER_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId }),
      signal
    });

    const status = res.status;

    if (status === 200) {
      const data: ChatResponse200 = await res.json();
      return { status, data };
    }

    if (status === 502) {
      const data502: ChatResponse502 = await res.json();
      return { status, data502, error: data502.error || 'Model execution failed (502 Bad Gateway)' };
    }

    if (status === 503) {
      const errJson = await res.json().catch(() => ({}));
      return {
        status,
        error:
          errJson.error ||
          'Model provider credential not configured. Please set the required API key in chat_server environment.'
      };
    }

    if (status === 422) {
      return { status, error: 'Cannot submit empty message (422 Unprocessable Entity)' };
    }

    const errorText = await res.text().catch(() => '');
    return { status, error: errorText || `HTTP ${status} from chat server` };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return {
      status: 0,
      unreachable: true,
      error: `Chat service unreachable at ${CHAT_SERVER_URL}. Start it with: uvicorn demo.chat_server:app --port 8100`
    };
  }
}

/**
 * Fetch trace detail and per-span evaluation from GET /v1/traces/{trace_id}
 */
export async function fetchTraceDetail(
  traceId: string,
  signal?: AbortSignal
): Promise<{
  data?: TraceDetailResponse;
  unreachable?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${AGENTPULSE_API_URL}/v1/traces/${encodeURIComponent(traceId)}`, { signal });
    if (!res.ok) {
      return { error: `HTTP ${res.status}: Failed to load trace ${traceId}` };
    }
    const data: TraceDetailResponse = await res.json();
    return { data };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return {
      unreachable: true,
      error: `AgentPulse API unreachable at ${AGENTPULSE_API_URL}. Start it with: uvicorn app.main:app --app-dir backend`
    };
  }
}

/**
 * Fetch Platform and Evaluator Health
 */
export async function fetchPlatformHealth(signal?: AbortSignal): Promise<PlatformHealth> {
  const result: PlatformHealth = {
    apiReady: false,
    evaluatorHealthy: false,
    workersAlive: 0,
    queueDepth: 0,
  };

  try {
    // 1. Ready probe
    const readyRes = await fetch(`${AGENTPULSE_API_URL}/v1/health/ready`, { signal });
    if (readyRes.ok) {
      result.apiReady = true;
    }
  } catch {
    result.apiReady = false;
  }

  try {
    // 2. Evaluator probe
    const evalRes = await fetch(`${AGENTPULSE_API_URL}/v1/health/evaluator`, { signal });
    if (evalRes.ok) {
      const evalData = await evalRes.json();
      result.evaluatorHealthy = evalData.status === 'healthy' || evalData.workers_alive > 0;
      result.workersAlive = evalData.workers_alive ?? 0;
      result.queueDepth = evalData.queue_depth ?? 0;
      result.lastEvalTime = evalData.last_eval_time;
    } else {
      result.evaluatorHealthy = false;
      result.errorMessage = `Evaluator health returned HTTP ${evalRes.status}`;
    }
  } catch (err: any) {
    result.evaluatorHealthy = false;
    result.errorMessage = `Evaluator worker unreachable. Start with: python -m app.worker`;
  }

  return result;
}

/**
 * Fetch Drift and Baseline statistics from /v1/drift and /v1/agents
 */
export async function fetchAgentDrift(signal?: AbortSignal): Promise<{
  drift: AgentDriftInfo[];
  unreachable?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${AGENTPULSE_API_URL}/v1/drift`, { signal });
    if (!res.ok) {
      return { drift: [], error: `HTTP ${res.status}: Failed to load drift statistics` };
    }
    const data = await res.json();
    return { drift: Array.isArray(data) ? data : data.drift || [] };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return {
      drift: [],
      unreachable: true,
      error: `AgentPulse API unreachable at ${AGENTPULSE_API_URL}`
    };
  }
}

/**
 * Acknowledge an Alert / Incident via PATCH /v1/alerts/{id}
 */
export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  try {
    const res = await fetch(`${AGENTPULSE_API_URL}/v1/alerts/${encodeURIComponent(alertId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'acknowledged' })
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Subscribe to WebSocket live spans for immediate stage progress
 */
export function createLiveSpanSocket(
  onSpan: (event: WsLiveSpanEvent) => void,
  onError?: () => void
): { close: () => void } {
  try {
    const wsUrl = AGENTPULSE_API_URL.replace(/^http/, 'ws') + '/v1/ws/live';
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'new_span') {
          onSpan(parsed as WsLiveSpanEvent);
        }
      } catch {
        // ignore parse error
      }
    };

    if (onError) {
      ws.onerror = onError;
    }

    return {
      close: () => {
        try {
          ws.close();
        } catch {}
      }
    };
  } catch {
    return { close: () => {} };
  }
}

/**
 * Poll trace until all evaluations land or timeout is reached.
 * Implements exponential backoff and cancellation.
 */
export function pollTraceEvaluation(
  traceId: string,
  onUpdate: (detail: TraceDetailResponse, isComplete: boolean) => void,
  onTimeout: () => void,
  signal?: AbortSignal
): () => void {
  let isCancelled = false;
  let timerId: any = null;
  let delay = 800; // ms
  const maxDelay = 3500; // ms
  const startTime = Date.now();
  const TIMEOUT_MS = 60000; // 60s timeout

  const poll = async () => {
    if (isCancelled || (signal && signal.aborted)) return;

    if (Date.now() - startTime > TIMEOUT_MS) {
      onTimeout();
      return;
    }

    const { data } = await fetchTraceDetail(traceId, signal);
    if (data && !isCancelled) {
      const spans = data.spans || [];
      const hasEvaluations =
        spans.length > 0 &&
        spans.some(s => s.evaluation !== null && s.evaluation !== undefined);
      
      const isAllEvaluated =
        spans.length > 0 &&
        spans.every(s => s.evaluation !== null && s.evaluation !== undefined);

      onUpdate(data, isAllEvaluated);

      if (isAllEvaluated) {
        // Complete! Stop polling.
        return;
      }
    }

    if (!isCancelled && !(signal && signal.aborted)) {
      delay = Math.min(delay * 1.35, maxDelay);
      timerId = setTimeout(poll, delay);
    }
  };

  // Kick off first poll after short delay to let worker pick it up
  timerId = setTimeout(poll, 600);

  return () => {
    isCancelled = true;
    if (timerId) clearTimeout(timerId);
  };
}
