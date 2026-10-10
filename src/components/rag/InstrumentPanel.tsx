import React from 'react';
import {
  Activity,
  Layers,
  ShieldAlert,
  Compass,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Check,
  Zap,
  Server
} from 'lucide-react';
import { ChatTurn, PlatformHealth, ApiTraceAlert } from '../../lib/ragTypes';
import { adaptAgentLedger, adaptDriftSummary, ViewAgentLedgerRow, ViewDriftRow } from '../../lib/adapters';
import { DatumDisplay } from './DatumDisplay';
import { datum } from '../../lib/stateModel';
import { riskTone, riskBadgeClasses, riskLabel } from '../../lib/riskTone';

interface InstrumentPanelProps {
  selectedTurn: ChatTurn | null;
  allTurns: ChatTurn[];
  platformHealth: PlatformHealth;
  driftData: any[];
  recentAlerts: ApiTraceAlert[];
  onAcknowledgeAlert: (alertId: string) => Promise<void>;
  onNavigateToTrace: (traceId: string) => void;
}

export const InstrumentPanel: React.FC<InstrumentPanelProps> = ({
  selectedTurn,
  allTurns,
  platformHealth,
  driftData,
  recentAlerts,
  onAcknowledgeAlert,
  onNavigateToTrace
}) => {
  // Adapted agent ledger rows
  const ledgerRows: ViewAgentLedgerRow[] = selectedTurn
    ? adaptAgentLedger(
        selectedTurn.agents || [],
        selectedTurn.traceDetail,
        selectedTurn.isEvaluating,
        selectedTurn.evaluationTimeout
      )
    : [];

  // Adapted drift summary
  const driftRows: ViewDriftRow[] = adaptDriftSummary(driftData);

  // Alerts from selected turn + recent alerts
  const turnAlerts: ApiTraceAlert[] = selectedTurn?.traceDetail?.alerts || [];
  const combinedAlerts = [...turnAlerts, ...recentAlerts.filter(a => !turnAlerts.some(ta => ta.id === a.id))];

  // Retriever row specifically for tool-claim check
  const retrieverRow = ledgerRows.find(r => r.agentRole.toLowerCase() === 'retriever');

  return (
    <div className="flex flex-col h-full aetheris-iris-pane border border-white/[0.14] rounded-2xl overflow-hidden shadow-2xl space-y-4 p-4 font-mono text-xs overflow-y-auto scrollbar-thin relative">
      {/* Top Specular Rim */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] aetheris-iris-specular pointer-events-none z-20" />

      {/* 1. Platform Strip (API & Evaluator Health) */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.10] flex flex-wrap items-center justify-between gap-3 shadow-md relative z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                platformHealth.apiReady ? 'bg-emerald-400 phosphor-emerald shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400 phosphor-rose shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              }`}
            />
            <span className="text-neutral-400 text-[11px]">API Port 8000:</span>
            <span className={`font-semibold ${platformHealth.apiReady ? 'text-emerald-300' : 'text-rose-300'}`}>
              {platformHealth.apiReady ? 'Ready' : 'Unreachable'}
            </span>
          </div>

          <div className="h-3 w-px bg-white/10" />

          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                platformHealth.evaluatorHealthy ? 'bg-emerald-400 phosphor-emerald shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 phosphor-amber shadow-[0_0_8px_rgba(251,191,36,0.8)]'
              }`}
            />
            <span className="text-neutral-400 text-[11px]">Evaluator Workers:</span>
            <span className={`font-semibold ${platformHealth.evaluatorHealthy ? 'text-emerald-300' : 'text-amber-300'}`}>
              {platformHealth.workersAlive} alive (Queue: {platformHealth.queueDepth})
            </span>
          </div>
        </div>

        {selectedTurn?.trace_id && (
          <button
            onClick={() => onNavigateToTrace(selectedTurn.trace_id!)}
            className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 text-[11px] underline decoration-cyan-500/30 hover:decoration-cyan-400"
          >
            <span>Inspect trace {selectedTurn.trace_id}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Evaluator Down Banner */}
      {!platformHealth.evaluatorHealthy && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-900/50 text-amber-200 text-xs flex items-start space-x-2.5 shadow-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-300">
              Evaluator worker is offline or disconnected
            </div>
            <p className="text-[11px] text-neutral-300">
              Spans will remain in <span className="font-semibold text-sky-300">Pending</span> state because background NLI evaluation workers are not processing the queue.
            </p>
            <div className="px-2 py-1 rounded bg-black/60 border border-white/10 font-mono text-[10px] text-white inline-block">
              python -m app.worker
            </div>
          </div>
        </div>
      )}

      {/* 2. Session Risk History Sparkline */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.10] space-y-2 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Session Risk Trajectory (Real Measured Scores Only)</span>
          </span>
          <span className="text-[10px] text-neutral-500">
            Unevaluated turns are gaps, not zeros
          </span>
        </div>

        {/* Real Risk Points Bar */}
        <div className="flex items-end space-x-2 h-10 px-2 py-1 bg-[#07080b] rounded-lg border border-white/[0.04]">
          {allTurns.length === 0 ? (
            <div className="w-full text-center text-neutral-600 text-[10px] my-auto">
              No turns executed yet
            </div>
          ) : (
            allTurns.map((turn, idx) => {
              const rootSpan = turn.traceDetail?.spans?.[0];
              const score = rootSpan?.evaluation?.overall_risk_score;
              const hasScore = typeof score === 'number';
              const isSelected = turn.id === selectedTurn?.id;

              return (
                <div
                  key={turn.id}
                  title={`Turn ${idx + 1}: ${hasScore ? `Risk ${(score * 100).toFixed(1)}%` : 'Pending/Unevaluated'}`}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {hasScore ? (
                    <div
                      style={{ height: `${Math.max(15, Math.min(100, score * 100))}%` }}
                      className={`w-full rounded-t transition-all ${
                        score > 0.7
                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                          : score > 0.4
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                          : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                      } ${isSelected ? 'ring-2 ring-white' : 'opacity-80 group-hover:opacity-100'}`}
                    />
                  ) : (
                    <div className="w-full h-1 bg-white/10 rounded-full" />
                  )}
                  <span className="text-[8px] text-neutral-500 mt-0.5">T{idx + 1}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Agent Ledger (The Product Core) */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.10] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">
              Agent Ledger: Grounding Risk & Evidence
            </h4>
          </div>
          {selectedTurn && (
            <span className="text-[10px] text-neutral-400 font-mono">
              Trace: <span className="text-white">{selectedTurn.trace_id || 'pending'}</span>
            </span>
          )}
        </div>

        {ledgerRows.length === 0 ? (
          <div className="p-6 text-center text-neutral-500 border border-dashed border-white/10 rounded-lg">
            Select a completed or running turn from the chat to inspect its agent ledger.
          </div>
        ) : (
          <div className="space-y-2.5">
            {ledgerRows.map((row) => (
              <div
                key={row.agentRole}
                className="p-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/[0.08] hover:border-purple-400/30 transition-all space-y-2.5 shadow-sm"
              >
                {/* Row Header: Role, Model, Latency, Tokens */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
                      {row.agentRole}
                    </span>
                    <span className="text-neutral-400 font-mono text-[11px]">{row.model}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px]">
                    <span className="text-neutral-400">
                      Latency: <span className="text-neutral-200 tabular-nums">{row.latencyMs} ms</span>
                    </span>
                    {row.tokensTotal !== undefined && (
                      <span className="text-neutral-400">
                        Tokens: <span className="text-neutral-200 tabular-nums">{row.tokensTotal}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Grounding Risk & Evaluation Verdict */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                      Grounding Risk (0.0 = Grounded &bull; 1.0 = Risk)
                    </div>
                    <div>
                      <DatumDisplay datum={row.groundingRisk} format="risk" />
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                      Evaluation Stage
                    </div>
                    <div>
                      <DatumDisplay datum={row.evaluationStage} format="stage" />
                    </div>
                  </div>
                </div>

                {/* Evidence vs Claim (Why the score is what it is) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {/* Evidence (input_summary) */}
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                      Evidence Given (input_summary)
                    </div>
                    <div className="text-[11px] text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto scrollbar-thin select-text">
                      {row.evidenceSummary || <span className="text-neutral-600 italic">No input evidence recorded</span>}
                    </div>
                  </div>

                  {/* Claim (output_summary) */}
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                      Agent Claim (output_summary)
                    </div>
                    <div className="text-[11px] text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto scrollbar-thin select-text">
                      {row.claimSummary || <span className="text-neutral-600 italic">No output claim recorded</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Tool-Claim Check (Retriever Real Result vs Claim) */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.10] space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">
              Tool-Claim Verification (Retriever)
            </h4>
          </div>
          <span className="text-[10px] text-neutral-500">
            Claim vs actual tool return
          </span>
        </div>

        {retrieverRow ? (
          <div className="p-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/[0.08] space-y-2.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-neutral-400">Tool Claim Risk:</span>
                <DatumDisplay datum={retrieverRow.toolClaimScore} format="risk" />
              </div>
              <div className="text-[11px] text-neutral-500 font-mono">
                Claims checked: <span className="text-neutral-400">n/a</span>
                <span className="text-[10px] text-neutral-600 ml-1">(not exposed by API yet)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-black/40 border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                  Retriever Claim:
                </span>
                <p className="text-neutral-300 select-text">
                  {retrieverRow.claimSummary || 'No claim recorded'}
                </p>
              </div>

              <div className="p-2 rounded bg-black/40 border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                  Tool's Real Result (tool_result_summary):
                </span>
                <p className="text-neutral-300 select-text">
                  {retrieverRow.toolResultSummary || 'No tool output payload recorded'}
                </p>
              </div>
            </div>

            {/* Backend Gaps Notification */}
            <div className="text-[10px] text-neutral-500 flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-white/[0.04]">
              <span>Disagreement score: <DatumDisplay datum={retrieverRow.disagreementScore} /></span>
              <span>Semantic similarity: <DatumDisplay datum={retrieverRow.semanticScore} /></span>
              <span>Input truncated: <DatumDisplay datum={retrieverRow.inputTruncated} /></span>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-neutral-500 border border-dashed border-white/10 rounded-lg text-xs">
            No retriever run recorded for this turn.
          </div>
        )}
      </div>

      {/* 5. Drift & Stability (Strict 32-Span Baseline Gate) */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.10] space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">
              Agent Drift & Stability (/v1/drift)
            </h4>
          </div>
          <span className="text-[10px] text-neutral-500">
            Window: 32 spans required
          </span>
        </div>

        {driftRows.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 border border-dashed border-white/10 rounded-lg text-xs">
            No agent drift records returned by /v1/drift
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {driftRows.map((d) => (
              <div
                key={d.agentId}
                className="p-3 rounded-lg bg-black/40 backdrop-blur-sm border border-white/[0.08] space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px] truncate">
                    {d.agentId}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded ${
                      d.isWarmedUp
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {d.warmupProgressText}
                  </span>
                </div>

                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>ASI:</span>
                    <DatumDisplay datum={d.asi} format="percentage" />
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Centroid Dist:</span>
                    <DatumDisplay datum={d.centroidDistance} />
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Tool Drift:</span>
                    <DatumDisplay datum={d.toolDrift} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Incidents & Alerts */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.10] space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">
              Turn & System Incidents (/v1/alerts)
            </h4>
          </div>
          <span className="text-[10px] text-neutral-500">
            {combinedAlerts.length} incidents recorded
          </span>
        </div>

        {combinedAlerts.length === 0 ? (
          <div className="p-3 rounded-lg bg-[#07080b] border border-white/[0.04] text-neutral-500 text-center text-xs">
            Zero incidents or threshold violations detected for this session.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {combinedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-2.5 rounded-lg bg-[#07080b] border border-rose-900/30 flex items-start justify-between gap-2"
              >
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                        alert.severity === 'critical'
                          ? 'bg-rose-500 text-neutral-950 font-bold'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-white font-semibold">{alert.type}</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-snug">{alert.message}</p>
                </div>

                {alert.status !== 'acknowledged' ? (
                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/15 text-neutral-300 hover:text-white text-[10px] border border-white/10 shrink-0 transition-colors"
                  >
                    Acknowledge
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-400 flex items-center space-x-0.5 shrink-0">
                    <Check className="w-3 h-3" />
                    <span>Acked</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
