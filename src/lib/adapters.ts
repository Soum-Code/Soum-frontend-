/**
 * Adapters mapping raw backend API payloads to view models strictly respecting
 * the 5 datum states, riskTone semantics, and drift baseline gates.
 */

import { Datum, datum } from './stateModel';
import {
  ChatAgentRun,
  TraceDetailResponse,
  SpanDetail,
  AgentDriftInfo,
  ApiAlert
} from './ragTypes';

const isNumber = (n: number | null | undefined): n is number => typeof n === 'number';

export interface ViewAgentLedgerRow {
  agentRole: string; // 'retriever' | 'verifier' | 'answerer'
  model: string;
  latencyMs: number;
  tokensTotal?: number;
  tokensPrompt?: number;
  tokensCompletion?: number;
  groundingRisk: Datum<number>;
  evaluationStage: Datum<'stage1' | 'stage2' | string>;
  toolClaimScore: Datum<number>;
  claimsCheckedCount: Datum<number>; // A5 gap: "not exposed by the API yet"
  disagreementScore: Datum<number>; // A5 gap: "not exposed by the API yet"
  semanticScore: Datum<number>; // A5 gap: "not exposed by the API yet"
  inputTruncated: Datum<boolean>; // A5 gap: "not exposed by the API yet"
  evidenceSummary?: string; // span.input_summary
  claimSummary?: string; // span.output_summary
  toolResultSummary?: string; // span.tool_result_summary
  spanId?: string;
  status: 'pending' | 'evaluated' | 'failed' | 'running';
}

export interface ViewDriftRow {
  agentId: string;
  baselineSize: number;
  isWarmedUp: boolean; // Gate: requires >= 32 spans
  warmupProgressText: string;
  asi: Datum<number>; // 0-100, higher is more stable
  centroidDistance: Datum<number>; // spike: one output against the running centroid
  windowCentroidDistance: Datum<number>; // sustained shift: what DRIFT_DETECTED alerts read
  toolDrift: Datum<number>;
}

export interface ViewAlert {
  id: number;
  type: string;
  /** Styling tier. The backend's HIGH is critical; anything else is shown as a warning. */
  severity: 'critical' | 'warning';
  /** The backend's own word for the severity, shown as given. */
  severityLabel: string;
  message: string;
  agentId?: string;
  traceId?: string;
  acknowledged: boolean;
  resolved: boolean;
  createdAt: string;
}

/**
 * Maps chat response agent runs and polled trace spans into Agent Ledger rows.
 */
export function adaptAgentLedger(
  agentsRan: ChatAgentRun[] = [],
  traceDetail?: TraceDetailResponse | null,
  isEvaluating = false,
  isTimeout = false
): ViewAgentLedgerRow[] {
  const spans: SpanDetail[] = traceDetail?.spans || [];

  // Match spans by agent_id or role
  const findSpanForAgent = (agentRole: string): SpanDetail | undefined => {
    return spans.find(
      s =>
        s.agent_id?.toLowerCase() === agentRole.toLowerCase() ||
        s.agent_role?.toLowerCase() === agentRole.toLowerCase()
    );
  };

  return agentsRan.map(agent => {
    const span = findSpanForAgent(agent.agent);
    // null means the worker has not evaluated this span yet. An evaluation that
    // exists but carries no score is a finished one (the evaluator skipped it),
    // and must not be shown as still pending.
    const evaluation = span?.evaluation;

    // Grounding Risk Datum
    let groundingRisk: Datum<number>;
    let evaluationStage: Datum<string>;
    let toolClaimScore: Datum<number>;

    if (evaluation && isNumber(evaluation.grounding_score)) {
      groundingRisk = datum.measured(evaluation.grounding_score);
    } else if (evaluation) {
      groundingRisk = datum.unmeasured(
        evaluation.evaluation_stage === 'skipped'
          ? 'evaluator skipped this span: it had no output to check'
          : 'evaluator returned no grounding score for this span'
      );
    } else if (isTimeout) {
      groundingRisk = datum.error('Evaluation timed out after 60s (evaluator worker may be down)');
    } else if (isEvaluating || span) {
      groundingRisk = datum.pending('Evaluating NLI in worker...');
    } else {
      groundingRisk = datum.pending('Waiting for span...');
    }

    // Evaluation Stage
    if (evaluation?.evaluation_stage) {
      evaluationStage = datum.measured(evaluation.evaluation_stage);
    } else if (evaluation) {
      evaluationStage = datum.unmeasured('evaluator recorded no stage');
    } else if (isEvaluating || span) {
      evaluationStage = datum.pending('Determining stage...');
    } else {
      evaluationStage = datum.unmeasured('not reached');
    }

    // Tool Claim Score (meaningful on retriever, otherwise unmeasured)
    if (agent.agent.toLowerCase() === 'retriever') {
      if (evaluation && isNumber(evaluation.tool_claim_score)) {
        toolClaimScore = datum.measured(evaluation.tool_claim_score);
      } else if (evaluation) {
        toolClaimScore = datum.unmeasured('tool-claim validator did not run on this span');
      } else if (isTimeout) {
        toolClaimScore = datum.error('Timed out');
      } else if (isEvaluating || span) {
        toolClaimScore = datum.pending('Checking tool claim...');
      } else {
        toolClaimScore = datum.pending('Waiting for tool execution...');
      }
    } else {
      toolClaimScore = datum.unmeasured('not applicable to this agent');
    }

    const tokensPrompt = span?.tokens_in ?? undefined;
    const tokensCompletion = span?.tokens_out ?? undefined;

    return {
      agentRole: agent.agent,
      model: agent.model || span?.model || '—',
      latencyMs: agent.latency_ms || span?.latency_ms || 0,
      // The total is only stated when both halves are known.
      tokensTotal:
        tokensPrompt !== undefined && tokensCompletion !== undefined
          ? tokensPrompt + tokensCompletion
          : undefined,
      tokensPrompt,
      tokensCompletion,
      groundingRisk,
      evaluationStage,
      toolClaimScore,
      // A5 Backend gaps: show absence, never fill it
      claimsCheckedCount: datum.unmeasured('not exposed by the API yet'),
      disagreementScore: datum.unmeasured('not exposed by the API yet'),
      semanticScore: datum.unmeasured('not exposed by the API yet'),
      inputTruncated: datum.unmeasured('not exposed by the API yet'),
      evidenceSummary: span?.input_summary ?? undefined,
      claimSummary: span?.output_summary || agent.output,
      toolResultSummary: span?.tool_result_summary ?? undefined,
      spanId: span?.span_id,
      status: span?.status === 'error'
        ? 'failed'
        : evaluation
        ? 'evaluated'
        : isEvaluating
        ? 'pending'
        : 'running',
    };
  });
}

/**
 * Maps raw drift telemetry with the strict 32-span warmup gate.
 */
export function adaptDriftSummary(driftList: AgentDriftInfo[] = []): ViewDriftRow[] {
  const REQUIRED_BASELINE = 32;

  return driftList.map(item => {
    const size = item.baseline_size ?? 0;
    const isWarmedUp = size >= REQUIRED_BASELINE;

    if (!isWarmedUp) {
      return {
        agentId: item.agent_id,
        baselineSize: size,
        isWarmedUp: false,
        warmupProgressText: `warming up: ${size} / ${REQUIRED_BASELINE} spans`,
        asi: datum.unmeasured(`needs ${REQUIRED_BASELINE} spans baseline (currently ${size})`),
        centroidDistance: datum.unmeasured(`needs ${REQUIRED_BASELINE} spans baseline`),
        windowCentroidDistance: datum.unmeasured(`needs ${REQUIRED_BASELINE} spans baseline`),
        toolDrift: datum.unmeasured(`needs ${REQUIRED_BASELINE} spans baseline`),
      };
    }

    return {
      agentId: item.agent_id,
      baselineSize: size,
      isWarmedUp: true,
      warmupProgressText: `${size} spans recorded`,
      asi: isNumber(item.current_asi)
        ? datum.measured(item.current_asi)
        : datum.unmeasured('no drift recorded'),
      centroidDistance: isNumber(item.latest_centroid_distance)
        ? datum.measured(item.latest_centroid_distance)
        : datum.unmeasured('no drift recorded'),
      windowCentroidDistance: isNumber(item.latest_window_centroid_distance)
        ? datum.measured(item.latest_window_centroid_distance)
        : datum.unmeasured('baseline and recent windows have not both filled yet'),
      toolDrift: isNumber(item.latest_tool_drift)
        ? datum.measured(item.latest_tool_drift)
        : datum.unmeasured('no tool drift recorded'),
    };
  });
}

/**
 * Maps a backend alert to what the incidents list draws. The backend's HIGH is
 * the only severity shown as critical, and its own wording is kept as the label.
 */
export function adaptAlert(alert: ApiAlert): ViewAlert {
  return {
    id: alert.id,
    type: alert.alert_type,
    severity: alert.severity === 'HIGH' ? 'critical' : 'warning',
    severityLabel: alert.severity,
    message: alert.message,
    agentId: alert.agent_id ?? undefined,
    traceId: alert.trace_id ?? undefined,
    acknowledged: alert.acknowledged,
    resolved: alert.resolved,
    createdAt: alert.created_at,
  };
}
