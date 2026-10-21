/**
 * Real API client for AgentPulse Chat Service (port 8100) and AgentPulse API (port 8000).
 *
 * Rules:
 * - NO mock data fallbacks
 * - NO hardcoded corpus list
 * - NO fabricated scores or synthetic answers
 * - Real errors, 502s, and 503s are surfaced directly
 *
 * Where the services live, and how requests authenticate:
 * - Each base URL can be set at runtime (window.__AGENTPULSE_API_URL__,
 *   window.__AGENTPULSE_CHAT_URL__) or at build time (VITE_AGENTPULSE_API_URL,
 *   VITE_CHAT_SERVER_URL). An explicitly empty value means "this origin", which
 *   is what a deployment behind the dashboard's nginx proxy wants; only an unset
 *   value falls back to localhost.
 * - Outside local development the API wants an X-API-Key on every route except
 *   the liveness/readiness probes. Behind the nginx proxy the proxy attaches it.
 *   Talking to the API directly, set window.__AGENTPULSE_API_KEY__ at runtime.
 *   It is deliberately not a VITE_* variable, which Vite would inline into the
 *   shipped JavaScript for every visitor. The key is only ever sent to the
 *   AgentPulse API, never to the chat service.
 *
 * The response shapes are the backend's, pinned by contract.test.ts against
 * recordings of the real services.
 */

import {
  AgentDriftInfo,
  AlertsResponse,
  ApiAlert,
  ChatResponse200,
  ChatResponse502,
  ChatServerHealth,
  CorpusResponse,
  DriftResponse,
  EvaluatorHealth,
  PlatformHealth,
  TraceDetailResponse,
  WsLiveSpanEvent
} from './ragTypes';

interface RuntimeGlobals {
  __AGENTPULSE_CHAT_URL__?: string;
  __AGENTPULSE_API_URL__?: string;
  __AGENTPULSE_API_KEY__?: string;
}

const runtime = (): RuntimeGlobals =>
  typeof window !== 'undefined' ? (window as unknown as RuntimeGlobals) : {};

/**
 * The first candidate that is a string wins, including the empty string (same
 * origin). Trailing slashes are dropped so paths join cleanly.
 */
export function resolveBaseUrl(candidates: Array<string | null | undefined>, fallback: string): string {
  const chosen = candidates.find((c): c is string => typeof c === 'string');
  return (chosen ?? fallback).replace(/\/+$/, '');
}

export const CHAT_SERVER_URL = resolveBaseUrl(
  [runtime().__AGENTPULSE_CHAT_URL__, (import.meta as any).env?.VITE_CHAT_SERVER_URL],
  'http://localhost:8100'
);

export const AGENTPULSE_API_URL = resolveBaseUrl(
  [runtime().__AGENTPULSE_API_URL__, (import.meta as any).env?.VITE_AGENTPULSE_API_URL],
  'http://localhost:8000'
);

const where = (base: string) => base || 'this origin';

const apiUrl = (path: string) => `${AGENTPULSE_API_URL}${path}`;

/** Request headers for the AgentPulse API: the caller's, plus the key when one is configured. */
export function agentpulseHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const key = runtime().__AGENTPULSE_API_KEY__?.trim();
  return key ? { ...extra, 'X-API-Key': key } : { ...extra };
}

/** A 401 means the key, not an outage; say so. */
function httpError(res: Response, what: string): string {
  if (res.status === 401) {
    return `HTTP 401: AgentPulse rejected the request; the API key is missing or wrong (${what})`;
  }
  return `HTTP ${res.status}: ${what}`;
}

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
      error: `Chat service unreachable at ${where(CHAT_SERVER_URL)}. Start it with: uvicorn demo.chat_server:app --port 8100`
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
      error: `Chat service unreachable at ${where(CHAT_SERVER_URL)}`
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
      error: `Chat service unreachable at ${where(CHAT_SERVER_URL)}. Start it with: uvicorn demo.chat_server:app --port 8100`
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
    const res = await fetch(apiUrl(`/v1/traces/${encodeURIComponent(traceId)}`), {
      signal,
      headers: agentpulseHeaders()
    });
    if (!res.ok) {
      return { error: httpError(res, `Failed to load trace ${traceId}`) };
    }
    const data: TraceDetailResponse = await res.json();
    return { data };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return {
      unreachable: true,
      error: `AgentPulse API unreachable at ${where(AGENTPULSE_API_URL)}. Start it with: uvicorn app.main:app --app-dir backend`
    };
  }
}

/**
 * Fetch Platform and Evaluator Health from /v1/health/ready and /v1/health/evaluator.
 *
 * The evaluator endpoint answers 503 when no worker is alive, with the same body
 * as a 200 and the reason in `reasons`, so a 503 is read, not treated as a failure
 * to reach it. It does not report queue depth, so `queueDepth` stays null.
 */
export async function fetchPlatformHealth(signal?: AbortSignal): Promise<PlatformHealth> {
  const result: PlatformHealth = {
    apiReady: false,
    evaluatorHealthy: false,
    workersAlive: 0,
    queueDepth: null,
  };

  try {
    // 1. Ready probe
    const readyRes = await fetch(apiUrl('/v1/health/ready'), { signal, headers: agentpulseHeaders() });
    result.apiReady = readyRes.ok;
  } catch {
    result.apiReady = false;
  }

  try {
    // 2. Evaluator probe
    const evalRes = await fetch(apiUrl('/v1/health/evaluator'), { signal, headers: agentpulseHeaders() });
    if (evalRes.ok || evalRes.status === 503) {
      const evalData: EvaluatorHealth = await evalRes.json();
      result.evaluatorHealthy = evalData.ready === true;
      result.workersAlive = evalData.workers_alive ?? 0;
      if (!result.evaluatorHealthy && evalData.reasons?.length) {
        result.errorMessage = evalData.reasons.join('; ');
      }
    } else {
      result.errorMessage = httpError(evalRes, 'Evaluator health check failed');
    }
  } catch {
    result.evaluatorHealthy = false;
    result.errorMessage = `AgentPulse API unreachable at ${where(AGENTPULSE_API_URL)}`;
  }

  return result;
}

/**
 * Fetch drift statistics from GET /v1/drift, which answers {agents: [...]}.
 */
export async function fetchAgentDrift(signal?: AbortSignal): Promise<{
  drift: AgentDriftInfo[];
  unreachable?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(apiUrl('/v1/drift'), { signal, headers: agentpulseHeaders() });
    if (!res.ok) {
      return { drift: [], error: httpError(res, 'Failed to load drift statistics') };
    }
    const data: DriftResponse = await res.json();
    return { drift: data.agents || [] };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return {
      drift: [],
      unreachable: true,
      error: `AgentPulse API unreachable at ${where(AGENTPULSE_API_URL)}`
    };
  }
}

/**
 * Fetch recent alerts from GET /v1/alerts (newest first).
 */
export async function fetchAlerts(signal?: AbortSignal): Promise<{
  alerts: ApiAlert[];
  unreachable?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(apiUrl('/v1/alerts?limit=50'), { signal, headers: agentpulseHeaders() });
    if (!res.ok) {
      return { alerts: [], error: httpError(res, 'Failed to load alerts') };
    }
    const data: AlertsResponse = await res.json();
    return { alerts: data.alerts || [] };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return {
      alerts: [],
      unreachable: true,
      error: `AgentPulse API unreachable at ${where(AGENTPULSE_API_URL)}`
    };
  }
}

/**
 * Acknowledge an alert via PATCH /v1/alerts/{id}.
 *
 * The backend reads `acknowledged`. It ignores unknown fields, so the earlier
 * body {status: 'acknowledged'} came back 200 and changed nothing. PATCH always
 * needs a key, even in local development.
 */
export async function acknowledgeAlert(alertId: number): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(`/v1/alerts/${alertId}`), {
      method: 'PATCH',
      headers: agentpulseHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ acknowledged: true })
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** ws:// or wss:// URL for the live span feed; an empty base means the page's own origin. */
export function websocketUrl(base: string, origin?: string): string {
  return `${(base || origin || '').replace(/^http/, 'ws')}/v1/ws/live`;
}

/**
 * Subscribe to WebSocket live spans for immediate stage progress
 */
export function createLiveSpanSocket(
  onSpan: (event: WsLiveSpanEvent) => void,
  onError?: () => void
): { close: () => void } {
  try {
    const origin = typeof window !== 'undefined' ? window.location?.origin : undefined;
    const ws = new WebSocket(websocketUrl(AGENTPULSE_API_URL, origin));

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
