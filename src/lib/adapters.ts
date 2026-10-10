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
  ApiTraceAlert
} from './ragTypes';

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
  asi: Datum<number>;
  centroidDistance: Datum<number>;
  toolDrift: Datum<number>;
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
        s.role?.toLowerCase() === agentRole.toLowerCase() ||
        s.span_id?.toLowerCase().includes(agentRole.toLowerCase())
    );
  };

  return agentsRan.map(agent => {
    const span = findSpanForAgent(agent.agent);
    const evaluation = span?.evaluation;

    // Grounding Risk Datum
    let groundingRisk: Datum<number>;
    let evaluationStage: Datum<string>;
    let toolClaimScore: Datum<number>;

    if (evaluation && evaluation.grounding_score !== null && evaluation.grounding_score !== undefined) {
      groundingRisk = datum.measured(evaluation.grounding_score);
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
    } else if (isEvaluating || span) {
      evaluationStage = datum.pending('Determining stage...');
    } else {
      evaluationStage = datum.unmeasured('not reached');
    }

    // Tool Claim Score (meaningful on retriever, otherwise unmeasured)
    if (agent.agent.toLowerCase() === 'retriever') {
      if (evaluation && evaluation.tool_claim_score !== null && evaluation.tool_claim_score !== undefined) {
        toolClaimScore = datum.measured(evaluation.tool_claim_score);
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

    return {
      agentRole: agent.agent,
      model: agent.model || span?.model || '—',
      latencyMs: agent.latency_ms || span?.latency_ms || 0,
      tokensTotal: span?.tokens?.total,
      tokensPrompt: span?.tokens?.prompt,
      tokensCompletion: span?.tokens?.completion,
      groundingRisk,
      evaluationStage,
      toolClaimScore,
      // A5 Backend gaps: show absence, never fill it
      claimsCheckedCount: datum.unmeasured('not exposed by the API yet'),
      disagreementScore: datum.unmeasured('not exposed by the API yet'),
      semanticScore: datum.unmeasured('not exposed by the API yet'),
      inputTruncated: datum.unmeasured('not exposed by the API yet'),
      evidenceSummary: span?.input_summary,
      claimSummary: span?.output_summary || agent.output,
      toolResultSummary: span?.tool_result_summary,
      spanId: span?.span_id,
      status: evaluation?.grounding_score !== null && evaluation?.grounding_score !== undefined
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
        toolDrift: datum.unmeasured(`needs ${REQUIRED_BASELINE} spans baseline`),
      };
    }

    return {
      agentId: item.agent_id,
      baselineSize: size,
      isWarmedUp: true,
      warmupProgressText: `${size} spans recorded`,
      asi: item.asi !== null && item.asi !== undefined
        ? datum.measured(item.asi)
        : datum.unmeasured('no drift recorded'),
      centroidDistance: item.centroid_distance !== null && item.centroid_distance !== undefined
        ? datum.measured(item.centroid_distance)
        : datum.unmeasured('no drift recorded'),
      toolDrift: item.tool_drift !== null && item.tool_drift !== undefined
        ? datum.measured(item.tool_drift)
        : datum.unmeasured('no tool drift recorded'),
    };
  });
}
