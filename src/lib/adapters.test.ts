import { describe, it, expect } from 'vitest';
import { adaptAgentLedger, adaptDriftSummary } from './adapters';
import { ChatAgentRun, TraceDetailResponse } from './ragTypes';

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
        trace: { id: 'tr-1', timestamp: '2026-10-01 10:00:00', status: 'ok' },
        spans: [
          {
            span_id: 'sp-1',
            trace_id: 'tr-1',
            agent_id: 'answerer',
            role: 'answerer',
            input_summary: 'Doc 1: Sales report',
            output_summary: 'Synthesized answer',
            evaluation: {
              grounding_score: 0.12,
              tool_claim_score: null,
              overall_risk_score: 0.12,
              label: 'low_risk',
              evaluation_stage: 'stage2'
            }
          }
        ]
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
      const raw = [{ agent_id: 'retriever', baseline_size: 14, asi: 0.12 }];
      const adapted = adaptDriftSummary(raw);

      expect(adapted[0].isWarmedUp).toBe(false);
      expect(adapted[0].warmupProgressText).toBe('warming up: 14 / 32 spans');
      // No drift value displayed before 32 spans
      expect(adapted[0].asi.status).toBe('unmeasured');
      expect(adapted[0].asi.value).toBeUndefined();
    });

    it('measures drift only once baseline >= 32 spans', () => {
      const raw = [{ agent_id: 'retriever', baseline_size: 32, asi: 0.045 }];
      const adapted = adaptDriftSummary(raw);

      expect(adapted[0].isWarmedUp).toBe(true);
      expect(adapted[0].asi.status).toBe('measured');
      expect(adapted[0].asi.value).toBe(0.045);
    });
  });
});
