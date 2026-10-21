import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Zap,
  Layers,
  Activity,
  Compass,
  Search,
  BookOpen,
  RefreshCw,
  SlidersHorizontal,
  Info,
  Radio,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { ChatPane } from './ChatPane';
import { InstrumentPanel } from './InstrumentPanel';
import {
  ChatTurn,
  PlatformHealth,
  ApiAlert,
  AgentDriftInfo,
  WsLiveSpanEvent
} from '../../lib/ragTypes';
import {
  sendChatMessage,
  fetchCorpus,
  fetchPlatformHealth,
  fetchAgentDrift,
  fetchAlerts,
  acknowledgeAlert,
  createLiveSpanSocket,
  pollTraceEvaluation,
  CHAT_SERVER_URL,
  AGENTPULSE_API_URL
} from '../../lib/ragApi';

interface RagMonitorViewProps {
  onNavigateToTrace: (traceId: string) => void;
}

export const RagMonitorView: React.FC<RagMonitorViewProps> = ({ onNavigateToTrace }) => {
  // Session Turns
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTurnSpansCount, setActiveTurnSpansCount] = useState(0);

  // Platform & Drift Telemetry (Real API contracts)
  const [platformHealth, setPlatformHealth] = useState<PlatformHealth>({
    apiReady: false,
    evaluatorHealthy: false,
    workersAlive: 0,
    queueDepth: null
  });
  const [driftData, setDriftData] = useState<AgentDriftInfo[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<ApiAlert[]>([]);

  // Corpus from GET /corpus
  const [corpusDocuments, setCorpusDocuments] = useState<string[]>([]);
  const [isCorpusLoading, setIsCorpusLoading] = useState(false);
  const [corpusUnreachable, setCorpusUnreachable] = useState(false);
  const [corpusError, setCorpusError] = useState<string | undefined>();

  // Active cancellation controllers
  const activeChatAbortRef = useRef<AbortController | null>(null);
  const activePollCancelRef = useRef<(() => void) | null>(null);

  // Load platform health and corpus on mount
  const refreshCorpus = useCallback(async () => {
    setIsCorpusLoading(true);
    const result = await fetchCorpus();
    setIsCorpusLoading(false);
    setCorpusDocuments(result.documents);
    setCorpusUnreachable(!!result.unreachable);
    setCorpusError(result.error);
  }, []);

  const refreshTelemetry = useCallback(async () => {
    const health = await fetchPlatformHealth();
    setPlatformHealth(health);

    const driftRes = await fetchAgentDrift();
    if (driftRes.drift) {
      setDriftData(driftRes.drift);
    }

    // Keep the last list on a failed poll rather than blanking the incidents.
    const alertsRes = await fetchAlerts();
    if (!alertsRes.error) {
      setRecentAlerts(alertsRes.alerts);
    }
  }, []);

  useEffect(() => {
    refreshCorpus();
    refreshTelemetry();

    // Periodic health check every 12 seconds
    const interval = setInterval(() => {
      refreshTelemetry();
    }, 12000);

    return () => clearInterval(interval);
  }, [refreshCorpus, refreshTelemetry]);

  // WebSocket Live Span listener
  useEffect(() => {
    const socket = createLiveSpanSocket((event: WsLiveSpanEvent) => {
      // If live span belongs to current pending turn, increment span counter
      setActiveTurnSpansCount((prev) => prev + 1);
    });

    return () => {
      socket.close();
    };
  }, []);

  // Clean up any in-flight polling on unmount
  useEffect(() => {
    return () => {
      if (activeChatAbortRef.current) {
        activeChatAbortRef.current.abort();
      }
      if (activePollCancelRef.current) {
        activePollCancelRef.current();
      }
    };
  }, []);

  // Send a chat question to POST /chat
  const handleSendMessage = async (userMessage: string) => {
    // Abort previous in-flight requests if any
    if (activeChatAbortRef.current) {
      activeChatAbortRef.current.abort();
    }
    if (activePollCancelRef.current) {
      activePollCancelRef.current();
    }

    const abortController = new AbortController();
    activeChatAbortRef.current = abortController;

    const turnId = `turn-${Date.now()}`;
    const newTurn: ChatTurn = {
      id: turnId,
      session_id: 'session-aetheris',
      user_message: userMessage,
      timestamp: new Date().toISOString(),
      status: 'running',
    };

    setTurns((prev) => [...prev, newTurn]);
    setSelectedTurnId(turnId);
    setIsLoading(true);
    setActiveTurnSpansCount(0);

    try {
      const response = await sendChatMessage(userMessage, 'session-aetheris', abortController.signal);

      if (response.status === 200 && response.data) {
        const data = response.data;
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  status: 'completed',
                  trace_id: data.trace_id,
                  reply: data.reply,
                  verifier_verdict: data.verifier_verdict,
                  retrieved: data.retrieved,
                  agents: data.agents,
                  isEvaluating: true,
                }
              : t
          )
        );

        // Start bounded polling on /v1/traces/{trace_id}
        if (data.trace_id) {
          const cancelPoll = pollTraceEvaluation(
            data.trace_id,
            (traceDetail, isComplete) => {
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === turnId
                    ? {
                        ...t,
                        traceDetail,
                        isEvaluating: !isComplete,
                      }
                    : t
                )
              );
            },
            () => {
              // Timeout after 60s
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === turnId
                    ? {
                        ...t,
                        isEvaluating: false,
                        evaluationTimeout: true,
                      }
                    : t
                )
              );
            },
            abortController.signal
          );
          activePollCancelRef.current = cancelPoll;
        }
      } else if (response.status === 502 && response.data502) {
        const d502 = response.data502;
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  status: 'failed',
                  trace_id: d502.trace_id,
                  error: d502.error || 'Model execution failed (502 Bad Gateway)',
                  agents: d502.agents,
                  retrieved: d502.retrieved,
                }
              : t
          )
        );
      } else {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  status: 'failed',
                  error: response.error || `HTTP ${response.status} from chat service`,
                }
              : t
          )
        );
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  status: 'failed',
                  error: err.message || 'Network request failed',
                }
              : t
          )
        );
      }
    } finally {
      setIsLoading(false);
      activeChatAbortRef.current = null;
    }
  };

  const handleAcknowledgeAlert = async (alertId: number) => {
    const ok = await acknowledgeAlert(alertId);
    if (ok) {
      setRecentAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      );
      setTurns((prev) =>
        prev.map((t) => {
          if (!t.traceDetail?.alerts) return t;
          return {
            ...t,
            traceDetail: {
              ...t.traceDetail,
              alerts: t.traceDetail.alerts.map((a) =>
                a.id === alertId ? { ...a, acknowledged: true } : a
              ),
            },
          };
        })
      );
    }
  };

  // Find currently selected turn
  const selectedTurn = turns.find((t) => t.id === selectedTurnId) || turns[turns.length - 1] || null;

  return (
    <div className="space-y-6 pb-20 aetheris-iris-glass aetheris-spatial-glow rounded-3xl p-3 sm:p-6 border border-purple-500/30 shadow-2xl relative">
      {/* Decorative Specular Top Rim */}
      <div className="absolute inset-x-0 top-0 h-[2px] aetheris-iris-specular pointer-events-none rounded-t-3xl" />

      {/* Header Bar: Aetheris Iris Brand & Quick Probes */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/[0.10]">
        <div className="flex items-center space-x-3.5">
          {/* Luminous Aperture Logo (Iris Prism) */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 p-[1.5px] aetheris-halo-glow shrink-0 shadow-lg">
            <div className="w-full h-full bg-[#080914] rounded-2xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-cyan-400/20 pointer-events-none" />
              <div className="w-6 h-6 rounded-full border-2 border-purple-300 border-t-transparent animate-spin-slow flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight flex items-center space-x-2">
                <span>Aetheris Iris</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 uppercase tracking-widest font-semibold shadow-xs">
                  Liquid Prism
                </span>
              </h2>
            </div>
            <p className="text-xs font-mono text-neutral-400 mt-0.5">
              Liquid Grounding & Multi-Agent Observability Prism
            </p>
          </div>
        </div>

        {/* Reference-Style Pill Shortcuts for Stimulus Questions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mr-1 hidden sm:inline">
            Quick Probes:
          </span>
          <button
            onClick={() => handleSendMessage('What are the latest revenue numbers reported in the fiscal documents?')}
            disabled={isLoading}
            className="aetheris-pill-button px-3 py-1 text-xs font-mono rounded-full text-neutral-200 hover:text-white flex items-center space-x-1.5"
            title="Probe grounded factual recall"
          >
            <Search className="w-3 h-3 text-purple-400" />
            <span>Factual Query</span>
          </button>
          <button
            onClick={() => handleSendMessage('Explain the multi-agent consensus architecture and validation safeguards.')}
            disabled={isLoading}
            className="aetheris-pill-button px-3 py-1 text-xs font-mono rounded-full text-neutral-200 hover:text-white flex items-center space-x-1.5"
            title="Probe multi-hop synthesis"
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Multi-Agent Synthesis</span>
          </button>
          <button
            onClick={() => handleSendMessage('Who was the Prime Minister of Mars in the year 2042?')}
            disabled={isLoading}
            className="aetheris-pill-button px-3 py-1 text-xs font-mono rounded-full text-rose-300 hover:text-rose-200 border-rose-500/30 flex items-center space-x-1.5"
            title="Probe ungrounded hallucination risk (not in corpus)"
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Hallucination Test</span>
          </button>
        </div>
      </div>

      {/* Main 2-Pane Split: Left (Chat Stimulus) + Right (Instrument Panel Product) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-h-[680px]">
        {/* Left Pane (5 Cols): The Chat Stimulus */}
        <div className="lg:col-span-5 h-[680px]">
          <ChatPane
            turns={turns}
            selectedTurnId={selectedTurn?.id || null}
            onSelectTurn={(id) => setSelectedTurnId(id)}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            activeTurnSpansCount={activeTurnSpansCount}
            corpusDocuments={corpusDocuments}
            isCorpusLoading={isCorpusLoading}
            corpusUnreachable={corpusUnreachable}
            corpusError={corpusError}
            onRefreshCorpus={refreshCorpus}
            onNavigateToTrace={onNavigateToTrace}
          />
        </div>

        {/* Right Pane (7 Cols): The Instrument Panel (The Observability Product) */}
        <div className="lg:col-span-7 h-[680px]">
          <InstrumentPanel
            selectedTurn={selectedTurn}
            allTurns={turns}
            platformHealth={platformHealth}
            driftData={driftData}
            recentAlerts={recentAlerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onNavigateToTrace={onNavigateToTrace}
          />
        </div>
      </div>
    </div>
  );
};
