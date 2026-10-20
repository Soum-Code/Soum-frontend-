import { describe, it, expect } from 'vitest';
import { adaptAgentLedger, adaptDriftSummary } from './adapters';
import { AgentDriftInfo, ChatAgentRun, SpanDetail, TraceDetailResponse } from './ragTypes';

// Inputs in the backend's real shape. contract.test.ts holds the tests that run
// against recorded responses; these cover the adapters' rules on small cases.
const span = (overrides: Partial<SpanDetail>): SpanDetail => ({
  span_id: 'sp-1',
  parent_span_id: null,
  agent_id: 'answerer',
  agent_role: null,
  event_type: 'agent_execution',
  span_kind: 'LLM',
  latency_ms: null,
  status: 'success',
  error_message: null,
  model: null,
  tokens_in: null,
  tokens_out: null,
  tool_name: null,
  tool_args: null,
  tool_result_summary: null,
  input_summary: null,
  output_summary: null,
  start_time: null,
  evaluation: null,
  ...overrides,
});

const drift = (overrides: Partial<AgentDriftInfo>): AgentDriftInfo => ({
  agent_id: 'retriever',
  current_asi: null,
  latest_centroid_distance: null,
  latest_window_centroid_distance: null,
  latest_tool_drift: null,
  baseline_size: 0,
  ...overrides,
});

describe('adapters', () => {
  describe('adaptAgentLedger', () => {
    const agentsRan: ChatAgentRun[] = [
      { agent: 'retriever', model: 'embedding-001', output: 'Fetched 3 docs', latency_ms: 120 },
      { agent: 'answerer', model: 'gemini-2.5-flash', output: 'Synthesized answer', latency_ms: 640 },
    ];

    it('marks grounding risk as pending when spans are evaluating', () => {
      const rows = adaptAgentLedger(agentsRan, null, true, false);
      expect(rows).toHaveLength(2);
      expect(rows[0].groundingRisk.status).toBe('pending');
      expect(rows[1].groundingRisk.status).toBe('pending');
    });

    it('marks grounding risk as measured when span evaluation arrives', () => {
      const mockTrace: TraceDetailResponse = {
        trace: {
          trace_id: 'tr-1',
          pipeline_id: null,
          service_name: 'rag_chat',
          start_time: '2026-10-01T10:00:00',
          end_time: null,
          status: 'running',
          total_spans: 1,
          overall_risk_score: null
        },
        spans: [
          span({
            input_summary: 'Doc 1: Sales report',
            output_summary: 'Synthesized answer',
            evaluation: {
              grounding_score: 0.12,
              tool_claim_score: null,
              overall_risk_score: 0.12,
              label: 'low_risk',
              evaluation_stage: 'stage2'
            }
          })
        ],
        alerts: []
      };

      const rows = adaptAgentLedger(agentsRan, mockTrace, false, false);
      const answererRow = rows.find(r => r.agentRole === 'answerer');
      expect(answererRow).toBeDefined();
      expect(answererRow?.groundingRisk.status).toBe('measured');
      expect(answererRow?.groundingRisk.value).toBe(0.12);
      expect(answererRow?.evaluationStage.value).toBe('stage2');
      expect(answererRow?.evidenceSummary).toBe('Doc 1: Sales report');
    });

    it('surfaces backend gaps as unmeasured with exact reason', () => {
      const rows = adaptAgentLedger(agentsRan, null, false, false);
      expect(rows[0].disagreementScore.status).toBe('unmeasured');
      expect(rows[0].disagreementScore.reason).toBe('not exposed by the API yet');
      expect(rows[0].claimsCheckedCount.reason).toBe('not exposed by the API yet');
      expect(rows[0].semanticScore.reason).toBe('not exposed by the API yet');
      expect(rows[0].inputTruncated.reason).toBe('not exposed by the API yet');
    });
  });

  describe('adaptDriftSummary', () => {
    it('enforces strict 32-span baseline gate and reports warming up', () => {
      const raw = [drift({ baseline_size: 14, current_asi: 12 })];
      const adapted = adaptDriftSummary(raw);

      expect(adapted[0].isWarmedUp).toBe(false);
      expect(adapted[0].warmupProgressText).toBe('warming up: 14 / 32 spans');
      // No drift value displayed before 32 spans
      expect(adapted[0].asi.status).toBe('unmeasured');
      expect(adapted[0].asi.value).toBeUndefined();
    });

    it('measures drift only once baseline >= 32 spans', () => {
      const raw = [drift({ baseline_size: 32, current_asi: 87.5 })];
      const adapted = adaptDriftSummary(raw);

      expect(adapted[0].isWarmedUp).toBe(true);
      expect(adapted[0].asi.status).toBe('measured');
      expect(adapted[0].asi.value).toBe(87.5);
    });
  });
});
