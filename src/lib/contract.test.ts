/**
 * Contract tests: the client, adapters and types against what the backend
 * really returns.
 *
 * Every response below was recorded from the AgentPulse API and the chat
 * service by scripts/capture_backend_fixtures.py. Where an older version of this
 * client disagreed with the backend, the test says what the backend does.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture, serve } from './__fixtures__';
import {
  acknowledgeAlert,
  agentpulseHeaders,
  createLiveSpanSocket,
  fetchAgentDrift,
  fetchAlerts,
  fetchChatServerHealth,
  fetchCorpus,
  fetchPlatformHealth,
  fetchTraceDetail,
  resolveBaseUrl,
  sendChatMessage,
  websocketUrl,
} from './ragApi';
import { adaptAgentLedger, adaptAlert, adaptDriftSummary } from './adapters';
import type {
  AgentDriftInfo,
  ApiAlert,
  ChatAgentRun,
  ChatResponse200,
  ChatResponse502,
  ChatResponse503,
  ChatServerHealth,
  EvaluatorHealth,
  SpanDetail,
  SpanEvaluation,
  TraceDetailResponse,
  TraceSummary,
  WsLiveSpanEvent,
} from './ragTypes';

afterEach(() => {
  vi.unstubAllGlobals();
});

// A literal typed Record<keyof T, true> must name every key of T and no other,
// so these lists cannot drift from the interfaces they describe.
const keysOf = (shape: Record<string, true>) => Object.keys(shape).sort();
const keysIn = (value: object) => Object.keys(value).sort();

const TRACE: Record<keyof TraceSummary, true> = {
  trace_id: true, pipeline_id: true, service_name: true, start_time: true,
  end_time: true, status: true, total_spans: true, overall_risk_score: true,
};
const SPAN: Record<keyof SpanDetail, true> = {
  span_id: true, parent_span_id: true, agent_id: true, agent_role: true, event_type: true,
  span_kind: true, latency_ms: true, status: true, error_message: true, model: true,
  tokens_in: true, tokens_out: true, tool_name: true, tool_args: true, tool_result_summary: true,
  input_summary: true, output_summary: true, start_time: true, evaluation: true,
};
const EVALUATION: Record<keyof SpanEvaluation, true> = {
  grounding_score: true, tool_claim_score: true, overall_risk_score: true, label: true, evaluation_stage: true,
};
const ALERT: Record<keyof ApiAlert, true> = {
  id: true, alert_type: true, severity: true, message: true, agent_id: true, trace_id: true,
  span_id: true, acknowledged: true, resolved: true, created_at: true, details: true,
};
const DRIFT: Record<keyof AgentDriftInfo, true> = {
  agent_id: true, current_asi: true, latest_centroid_distance: true,
  latest_window_centroid_distance: true, latest_tool_drift: true, baseline_size: true,
};
const EVALUATOR: Record<keyof EvaluatorHealth, true> = {
  ready: true, workers_alive: true, workers_registered: true, workers_stale: true,
  stale_after_seconds: true, backend_distribution: true, degraded_workers: true,
  degraded: true, reasons: true,
};
const CHAT_200: Record<keyof ChatResponse200, true> = {
  session_id: true, trace_id: true, reply: true, verifier_verdict: true, retrieved: true, agents: true,
};
const CHAT_502: Record<keyof ChatResponse502, true> = {
  session_id: true, trace_id: true, error: true, agents: true, retrieved: true,
};
const CHAT_503: Record<keyof ChatResponse503, true> = { session_id: true, error: true, agents: true };
const CHAT_AGENT: Record<keyof ChatAgentRun, true> = { agent: true, model: true, output: true, latency_ms: true };
const CHAT_HEALTH: Record<keyof ChatServerHealth, true> = {
  provider: true, base_url: true, models: true, key_configured: true, key_env: true,
};
const WS_SPAN: Record<keyof WsLiveSpanEvent, true> = {
  type: true, trace_id: true, span_id: true, agent_id: true, status: true, latency_ms: true,
};

describe('recorded responses match the declared types', () => {
  it('GET /v1/traces/{id}', () => {
    const { body } = fixture<TraceDetailResponse>('trace_evaluated');
    expect(keysIn(body)).toEqual(['alerts', 'spans', 'trace']);
    expect(keysIn(body.trace)).toEqual(keysOf(TRACE));
    for (const span of body.spans) {
      expect(keysIn(span)).toEqual(keysOf(SPAN));
      expect(keysIn(span.evaluation!)).toEqual(keysOf(EVALUATION));
    }
    for (const alert of body.alerts) expect(keysIn(alert)).toEqual(keysOf(ALERT));
  });

  it('GET /v1/drift is {agents: [...]}, not {drift: [...]}', () => {
    const { body } = fixture<{ agents: AgentDriftInfo[] }>('drift');
    expect(keysIn(body)).toEqual(['agents']);
    for (const agent of body.agents) expect(keysIn(agent)).toEqual(keysOf(DRIFT));
  });

  it('GET /v1/alerts', () => {
    const { body } = fixture<{ alerts: ApiAlert[] }>('alerts');
    expect(keysIn(body)).toEqual(['alerts']);
    for (const alert of body.alerts) expect(keysIn(alert)).toEqual(keysOf(ALERT));
  });

  it('GET /v1/health/evaluator, alive and with no worker', () => {
    expect(keysIn(fixture('health_evaluator_alive').body)).toEqual(keysOf(EVALUATOR));
    expect(keysIn(fixture('health_evaluator_none').body)).toEqual(keysOf(EVALUATOR));
  });

  it('the chat service responses', () => {
    expect(keysIn(fixture('chat_200').body)).toEqual(keysOf(CHAT_200));
    expect(keysIn(fixture('chat_502').body)).toEqual(keysOf(CHAT_502));
    expect(keysIn(fixture('chat_503').body)).toEqual(keysOf(CHAT_503));
    expect(keysIn(fixture('chat_health').body)).toEqual(keysOf(CHAT_HEALTH));
    for (const agent of fixture<ChatResponse200>('chat_200').body.agents) {
      expect(keysIn(agent)).toEqual(keysOf(CHAT_AGENT));
    }
  });

  it('the WebSocket new_span message', () => {
    expect(keysIn(fixture('ws_new_span').body)).toEqual(keysOf(WS_SPAN));
  });

  // The ledger labels four signals "not exposed by the API yet". That is a claim
  // about the backend, so it is checked against the backend: if a trace starts
  // returning one of these, this fails and the ledger should show it.
  it('still does not expose the four signals the ledger marks unmeasured', () => {
    const evaluation = fixture<TraceDetailResponse>('trace_evaluated').body.spans[0].evaluation!;
    for (const key of ['claims_checked', 'tool_claims_found', 'disagreement_score', 'semantic_score', 'input_truncated']) {
      expect(evaluation).not.toHaveProperty(key);
    }
  });
});

describe('acknowledging an alert', () => {
  it('shows why {status: "acknowledged"} did nothing', () => {
    // 200 "updated", and every alert still unacknowledged: the field the
    // backend reads is `acknowledged`, and the model ignores unknown fields.
    expect(fixture('alert_patch_legacy_body').status).toBe(200);
    const stuck = fixture<{ alerts: ApiAlert[] }>('alerts_after_legacy_patch').body.alerts;
    expect(stuck.every(a => a.acknowledged === false)).toBe(true);
    const acked = fixture<{ alerts: ApiAlert[] }>('alerts_after_ack').body.alerts;
    expect(acked.find(a => a.id === 2)?.acknowledged).toBe(true);
  });

  it('sends {acknowledged: true} to the integer id', async () => {
    const backend = serve({ 'PATCH /v1/alerts/2': fixture('alert_patch') });
    vi.stubGlobal('fetch', backend.fetch);

    expect(await acknowledgeAlert(2)).toBe(true);

    const [call] = backend.calls;
    expect(call.method).toBe('PATCH');
    expect(call.path).toBe('/v1/alerts/2');
    expect(JSON.parse(call.body!)).toEqual({ acknowledged: true });
    expect(call.headers.get('Content-Type')).toBe('application/json');
  });

  it('reports failure when the backend does not find the alert', async () => {
    vi.stubGlobal('fetch', serve({ 'PATCH /v1/alerts/999999': fixture('alert_patch_not_found') }).fetch);
    expect(await acknowledgeAlert(999999)).toBe(false);
  });
});

describe('alerts', () => {
  it('fetchAlerts reads GET /v1/alerts', async () => {
    vi.stubGlobal('fetch', serve({ 'GET /v1/alerts': fixture('alerts') }).fetch);
    const result = await fetchAlerts();
    expect(result.error).toBeUndefined();
    expect(result.alerts.map(a => a.id)).toEqual([4, 3, 2, 1]);
  });

  it('adaptAlert maps HIGH and MEDIUM, and keeps the backend wording', () => {
    const [asiDrop, , grounding] = fixture<{ alerts: ApiAlert[] }>('alerts').body.alerts;
    const medium = adaptAlert(asiDrop);
    expect(medium).toMatchObject({ id: 4, type: 'ASI_DROP', severity: 'warning', severityLabel: 'MEDIUM', acknowledged: false });
    expect(medium.agentId).toBe('retriever');
    expect(medium.traceId).toBeUndefined();

    const high = adaptAlert(grounding);
    expect(high).toMatchObject({ id: 2, type: 'GROUNDING_FAILURE', severity: 'critical', severityLabel: 'HIGH' });
    expect(high.traceId).toBe(grounding.trace_id);
    expect(high.message).toBe(grounding.message);
  });

  it('an unrecognised severity is shown as given, not promoted to critical', () => {
    const odd = { ...fixture<{ alerts: ApiAlert[] }>('alerts').body.alerts[0], severity: 'LOW' };
    expect(adaptAlert(odd)).toMatchObject({ severity: 'warning', severityLabel: 'LOW' });
  });

  it('treats a resolved alert as handled even when it was never acknowledged', () => {
    const resolved = { ...fixture<{ alerts: ApiAlert[] }>('alerts').body.alerts[0], resolved: true };
    expect(adaptAlert(resolved)).toMatchObject({ acknowledged: false, resolved: true });
  });
});

describe('drift', () => {
  it('fetchAgentDrift reads the agents array', async () => {
    vi.stubGlobal('fetch', serve({ 'GET /v1/drift': fixture('drift') }).fetch);
    const result = await fetchAgentDrift();
    expect(result.error).toBeUndefined();
    expect(result.drift.map(d => d.agent_id)).toEqual(['retriever', 'verifier', 'answerer']);
  });

  const rows = () => adaptDriftSummary(fixture<{ agents: AgentDriftInfo[] }>('drift').body.agents);

  it('reads the real field names, on the ASI scale the backend uses (0-100)', () => {
    const retriever = rows().find(r => r.agentId === 'retriever')!;
    expect(retriever.isWarmedUp).toBe(true);
    expect(retriever.asi).toEqual({ status: 'measured', value: 42.0 });
    expect(retriever.centroidDistance).toEqual({ status: 'measured', value: 0.27 });
    expect(retriever.windowCentroidDistance).toEqual({ status: 'measured', value: 0.34 });
    expect(retriever.toolDrift).toEqual({ status: 'measured', value: 0.05 });
  });

  it('opens the gate at exactly 32 samples (20 baseline + 12 window)', () => {
    const verifier = rows().find(r => r.agentId === 'verifier')!;
    expect(verifier.baselineSize).toBe(32);
    expect(verifier.isWarmedUp).toBe(true);
    expect(verifier.asi.value).toBe(88.4);
  });

  it('shows nothing below the gate, even where the backend has a value', () => {
    const answerer = rows().find(r => r.agentId === 'answerer')!;
    expect(answerer.isWarmedUp).toBe(false);
    expect(answerer.warmupProgressText).toBe('warming up: 14 / 32 spans');
    // /v1/drift returned latest_centroid_distance 0.18 for this agent.
    expect(answerer.centroidDistance.status).toBe('unmeasured');
    expect(answerer.windowCentroidDistance.status).toBe('unmeasured');
  });

  it('a null past the gate is unmeasured, never zero', () => {
    const [warm] = fixture<{ agents: AgentDriftInfo[] }>('drift').body.agents;
    const [row] = adaptDriftSummary([{ ...warm, latest_window_centroid_distance: null, current_asi: null }]);
    expect(row.windowCentroidDistance.status).toBe('unmeasured');
    expect(row.asi.status).toBe('unmeasured');
    expect(row.asi.value).toBeUndefined();
  });
});

describe('trace detail and the agent ledger', () => {
  const agents = fixture<ChatResponse200>('chat_200').body.agents;

  it('fetchTraceDetail reads GET /v1/traces/{id}', async () => {
    const recorded = fixture<TraceDetailResponse>('trace_evaluated');
    vi.stubGlobal('fetch', serve({ [`GET ${recorded.path}`]: recorded }).fetch);
    const result = await fetchTraceDetail(recorded.body.trace.trace_id);
    expect(result.error).toBeUndefined();
    expect(result.data?.trace.trace_id).toBe(recorded.body.trace.trace_id);
    expect(result.data?.spans).toHaveLength(3);
  });

  it('a 404 is an error, not an empty trace', async () => {
    vi.stubGlobal('fetch', serve({ 'GET /v1/traces/does-not-exist': fixture('trace_not_found') }).fetch);
    const result = await fetchTraceDetail('does-not-exist');
    expect(result.data).toBeUndefined();
    expect(result.error).toMatch(/404/);
  });

  it('reads scores, stage and tokens from an evaluated trace', () => {
    const trace = fixture<TraceDetailResponse>('trace_evaluated').body;
    const rows = adaptAgentLedger(agents, trace, false, false);
    const answerer = rows.find(r => r.agentRole === 'answerer')!;
    expect(answerer.groundingRisk).toEqual({ status: 'measured', value: 0.81 });
    expect(answerer.evaluationStage).toEqual({ status: 'measured', value: 'stage2' });
    expect(answerer.status).toBe('evaluated');
    expect(answerer.tokensPrompt).toBe(412);
    expect(answerer.tokensCompletion).toBe(58);
    expect(answerer.tokensTotal).toBe(470);
    expect(answerer.evidenceSummary).toMatch(/^SQLite Write-Ahead Logging/);
    expect(answerer.claimSummary).toMatch(/^Drift is the shift/);
    expect(answerer.spanId).toBe(trace.spans.find(s => s.agent_id === 'answerer')!.span_id);
  });

  it('measures the tool-claim score on the retriever only', () => {
    const rows = adaptAgentLedger(agents, fixture<TraceDetailResponse>('trace_evaluated').body, false, false);
    const retriever = rows.find(r => r.agentRole === 'retriever')!;
    expect(retriever.toolClaimScore).toEqual({ status: 'measured', value: 0 });
    expect(retriever.toolResultSummary).toMatch(/^Found 3 documents/);
    expect(rows.find(r => r.agentRole === 'verifier')!.toolClaimScore.status).toBe('unmeasured');
  });

  it('is pending, not zero, while the worker has not evaluated the spans', () => {
    const rows = adaptAgentLedger(agents, fixture<TraceDetailResponse>('trace_pending').body, true, false);
    for (const row of rows) {
      expect(row.groundingRisk.status).toBe('pending');
      expect(row.evaluationStage.status).toBe('pending');
    }
    expect(rows.find(r => r.agentRole === 'retriever')!.toolClaimScore.status).toBe('pending');
  });

  it('a span the evaluator skipped is unmeasured, not pending forever', () => {
    // trace_failed holds a real "skipped" evaluation: the verifier span failed,
    // so it had no output to check.
    const trace = fixture<TraceDetailResponse>('trace_failed').body;
    const skipped = trace.spans.find(s => s.agent_id === 'verifier')!;
    expect(skipped.evaluation?.evaluation_stage).toBe('skipped');
    expect(skipped.evaluation?.grounding_score).toBeNull();

    const ran: ChatAgentRun[] = [
      ...fixture<ChatResponse502>('chat_502').body.agents!,
      { agent: 'verifier', model: 'fixture-verifier', output: '', latency_ms: 0 },
    ];
    const row = adaptAgentLedger(ran, trace, false, false).find(r => r.agentRole === 'verifier')!;
    expect(row.groundingRisk.status).toBe('unmeasured');
    expect(row.groundingRisk.reason).toMatch(/skipped/i);
    expect(row.evaluationStage).toEqual({ status: 'measured', value: 'skipped' });
    expect(row.status).toBe('failed');
  });

  it('keeps the four unmeasured gaps with their reason', () => {
    const [row] = adaptAgentLedger(agents, null, false, false);
    for (const gap of [row.claimsCheckedCount, row.disagreementScore, row.semanticScore, row.inputTruncated]) {
      expect(gap).toEqual({ status: 'unmeasured', reason: 'not exposed by the API yet' });
    }
  });
});

describe('platform health', () => {
  it('reads a live evaluator from `ready` and `workers_alive`', async () => {
    vi.stubGlobal('fetch', serve({
      'GET /v1/health/ready': fixture('health_ready'),
      'GET /v1/health/evaluator': fixture('health_evaluator_alive'),
    }).fetch);
    const health = await fetchPlatformHealth();
    expect(health).toMatchObject({ apiReady: true, evaluatorHealthy: true, workersAlive: 1 });
    expect(health.errorMessage).toBeUndefined();
  });

  it('reads the 503 body: no worker, with the backend\'s own reason', async () => {
    vi.stubGlobal('fetch', serve({
      'GET /v1/health/ready': fixture('health_ready'),
      'GET /v1/health/evaluator': fixture('health_evaluator_none'),
    }).fetch);
    const health = await fetchPlatformHealth();
    expect(health).toMatchObject({ apiReady: true, evaluatorHealthy: false, workersAlive: 0 });
    expect(health.errorMessage).toMatch(/no evaluation worker has sent a heartbeat/);
  });

  it('does not invent a queue depth the evaluator endpoint never reports', async () => {
    vi.stubGlobal('fetch', serve({
      'GET /v1/health/ready': fixture('health_ready'),
      'GET /v1/health/evaluator': fixture('health_evaluator_alive'),
    }).fetch);
    expect((await fetchPlatformHealth()).queueDepth).toBeNull();
  });
});

describe('the chat service', () => {
  it('fetchCorpus and fetchChatServerHealth', async () => {
    vi.stubGlobal('fetch', serve({
      'GET /corpus': fixture('chat_corpus'),
      'GET /health': fixture('chat_health'),
    }).fetch);
    const corpus = await fetchCorpus();
    expect(corpus.documents.length).toBeGreaterThan(0);
    const health = await fetchChatServerHealth();
    expect(health.health?.provider).toBe('nvidia');
    expect(health.health?.key_configured).toBe(true);
  });

  it('200 carries the trace id and one run per agent', async () => {
    const backend = serve({ 'POST /chat': fixture('chat_200') });
    vi.stubGlobal('fetch', backend.fetch);
    const result = await sendChatMessage('What is agent drift?', 'sess_fixture');
    expect(result.status).toBe(200);
    expect(result.data?.agents.map(a => a.agent)).toEqual(['retriever', 'verifier', 'answerer']);
    expect(JSON.parse(backend.calls[0].body!)).toEqual({ message: 'What is agent drift?', session_id: 'sess_fixture' });
  });

  it('502 keeps the agents that did finish', async () => {
    vi.stubGlobal('fetch', serve({ 'POST /chat': fixture('chat_502') }).fetch);
    const result = await sendChatMessage('What is agent drift?');
    expect(result.status).toBe(502);
    expect(result.data502?.agents?.map(a => a.agent)).toEqual(['retriever']);
    expect(result.error).toMatch(/verifier/);
  });

  it('503 says which credential is missing', async () => {
    vi.stubGlobal('fetch', serve({ 'POST /chat': fixture('chat_503') }).fetch);
    const result = await sendChatMessage('What is agent drift?');
    expect(result.status).toBe(503);
    expect(result.error).toMatch(/NVIDIA_API_KEY/);
  });

  it('422 for an empty message', async () => {
    vi.stubGlobal('fetch', serve({ 'POST /chat': fixture('chat_422') }).fetch);
    expect((await sendChatMessage('')).status).toBe(422);
  });
});

describe('the live span socket', () => {
  class FakeSocket {
    static last: FakeSocket;
    onmessage: ((e: { data: string }) => void) | null = null;
    onerror: (() => void) | null = null;
    closed = false;
    constructor(public url: string) {
      FakeSocket.last = this;
    }
    close() {
      this.closed = true;
    }
  }

  it('hands a recorded new_span message to the listener', () => {
    vi.stubGlobal('WebSocket', FakeSocket);
    const seen: WsLiveSpanEvent[] = [];
    const socket = createLiveSpanSocket(e => seen.push(e));
    FakeSocket.last.onmessage!({ data: JSON.stringify(fixture('ws_new_span').body) });
    FakeSocket.last.onmessage!({ data: 'pong' });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ type: 'new_span', agent_id: 'retriever', status: 'success' });
    socket.close();
    expect(FakeSocket.last.closed).toBe(true);
  });

  it('builds ws:// and wss:// URLs, and uses the page origin for a same-origin base', () => {
    expect(websocketUrl('http://localhost:8000')).toBe('ws://localhost:8000/v1/ws/live');
    expect(websocketUrl('https://pulse.example.com')).toBe('wss://pulse.example.com/v1/ws/live');
    expect(websocketUrl('', 'https://pulse.example.com')).toBe('wss://pulse.example.com/v1/ws/live');
  });
});

describe('where the client sends requests, and with what', () => {
  it('an explicitly empty base means same-origin; only an unset one falls back', () => {
    const fallback = 'http://localhost:8000';
    expect(resolveBaseUrl([undefined, undefined], fallback)).toBe(fallback);
    expect(resolveBaseUrl(['', 'http://other'], fallback)).toBe('');
    expect(resolveBaseUrl([undefined, ''], fallback)).toBe('');
    expect(resolveBaseUrl(['https://pulse.example.com///'], fallback)).toBe('https://pulse.example.com');
  });

  it('sends X-API-Key from the runtime global, never invents one', async () => {
    const backend = serve({ 'GET /v1/drift': fixture('drift') });
    vi.stubGlobal('fetch', backend.fetch);

    await fetchAgentDrift();
    expect(backend.calls[0].headers.has('X-API-Key')).toBe(false);

    vi.stubGlobal('window', { __AGENTPULSE_API_KEY__: '  secret  ' });
    await fetchAgentDrift();
    expect(backend.calls[1].headers.get('X-API-Key')).toBe('secret');
    expect(agentpulseHeaders({ 'Content-Type': 'application/json' })).toEqual({
      'Content-Type': 'application/json',
      'X-API-Key': 'secret',
    });
  });

  it('a 401 names the key, so it is not mistaken for an outage', async () => {
    vi.stubGlobal('fetch', serve({
      'GET /v1/drift': { method: 'GET', path: '/v1/drift', status: 401, body: { detail: 'Invalid or missing API key' } },
    }).fetch);
    const result = await fetchAgentDrift();
    expect(result.drift).toEqual([]);
    expect(result.unreachable).toBeUndefined();
    expect(result.error).toMatch(/401.*API key/i);
  });
});
