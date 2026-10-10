import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Terminal,
  FileText
} from 'lucide-react';
import { ChatTurn } from '../../lib/ragTypes';
import { CHAT_SERVER_URL } from '../../lib/ragApi';

interface ChatPaneProps {
  turns: ChatTurn[];
  selectedTurnId: string | null;
  onSelectTurn: (turnId: string) => void;
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  activeTurnSpansCount: number;
  corpusDocuments: string[];
  isCorpusLoading: boolean;
  corpusUnreachable: boolean;
  corpusError?: string;
  onRefreshCorpus: () => void;
  onNavigateToTrace: (traceId: string) => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  turns,
  selectedTurnId,
  onSelectTurn,
  onSendMessage,
  isLoading,
  activeTurnSpansCount,
  corpusDocuments,
  isCorpusLoading,
  corpusUnreachable,
  corpusError,
  onRefreshCorpus,
  onNavigateToTrace
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isCorpusDrawerOpen, setIsCorpusDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns.length, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const msg = inputMessage.trim();
    setInputMessage('');
    await onSendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full aetheris-iris-pane border border-white/[0.14] rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Top Specular Rim */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] aetheris-iris-specular pointer-events-none z-20" />

      {/* Chat Pane Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-md relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 phosphor-cyan shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <div>
            <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-wider flex items-center space-x-2">
              <span>Stimulus: RAG Chat</span>
              <span className="text-[10px] text-purple-300 font-normal border border-purple-500/25 px-1.5 py-0.2 rounded-full bg-purple-500/10">
                port 8100
              </span>
            </h3>
            <p className="text-[10px] font-mono text-neutral-400">
              Real 3-agent orchestration (Retriever &rarr; Verifier &rarr; Answerer)
            </p>
          </div>
        </div>

        {/* Corpus Index Drawer Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCorpusDrawerOpen(!isCorpusDrawerOpen)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors ${
              corpusUnreachable
                ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                : isCorpusDrawerOpen
                ? 'bg-white/10 text-white border-white/30'
                : 'bg-white/[0.04] text-neutral-300 border-white/[0.08] hover:text-white hover:border-white/20'
            }`}
            title="Inspect documents available to the retriever (/corpus)"
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
            <span>Corpus</span>
            <span className="text-[10px] bg-black/40 px-1.5 rounded">
              {corpusUnreachable ? 'offline' : corpusDocuments.length}
            </span>
          </button>
        </div>
      </div>

      {/* Corpus Inspection Banner (Collapsible) */}
      {isCorpusDrawerOpen && (
        <div className="p-3.5 bg-[#0e1017] border-b border-white/[0.08] text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-neutral-300">
            <span className="font-semibold text-white flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Retriever Corpus Index (GET /corpus)</span>
            </span>
            <button
              onClick={onRefreshCorpus}
              disabled={isCorpusLoading}
              className="text-neutral-400 hover:text-white flex items-center space-x-1 text-[11px]"
              title="Refresh /corpus from chat server"
            >
              <RefreshCw className={`w-3 h-3 ${isCorpusLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {corpusUnreachable ? (
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-200 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Chat service unreachable at {CHAT_SERVER_URL}</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Start the real chat server in your terminal:
              </div>
              <div className="px-2 py-1 rounded bg-black/60 border border-white/10 font-mono text-[11px] text-neutral-200 flex items-center space-x-1.5">
                <Terminal className="w-3 h-3 text-neutral-400" />
                <span>uvicorn demo.chat_server:app --port 8100</span>
              </div>
            </div>
          ) : corpusDocuments.length === 0 ? (
            <div className="p-3 rounded-lg bg-black/30 border border-dashed border-white/10 text-neutral-400 text-center">
              No documents returned by /corpus
            </div>
          ) : (
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {corpusDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 rounded bg-white/[0.02] border border-white/[0.04] text-[11px] text-neutral-300 truncate"
                  title={doc}
                >
                  {doc}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 font-mono">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-neutral-400 shadow-inner">
              <Bot className="w-6 h-6 text-neutral-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Live Multi-Agent RAG</h4>
              <p className="text-xs text-neutral-400 max-w-sm mt-1">
                Type a question below. Real retriever, verifier, and answerer agents will run, and AgentPulse will measure grounding risk live.
              </p>
            </div>
            {corpusUnreachable && (
              <div className="max-w-md p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-left text-xs text-rose-200 space-y-1.5 mt-2">
                <div className="flex items-center space-x-1.5 font-semibold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Chat Server Down (Port 8100)</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  The chat server owns the models and provider keys. Start it with:
                </p>
                <div className="px-2 py-1 rounded bg-black/60 border border-white/10 font-mono text-[11px] text-white">
                  uvicorn demo.chat_server:app --port 8100
                </div>
              </div>
            )}
          </div>
        ) : (
          turns.map((turn) => {
            const isSelected = turn.id === selectedTurnId;
            return (
              <div
                key={turn.id}
                onClick={() => onSelectTurn(turn.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer font-mono text-xs space-y-2.5 relative overflow-hidden ${
                  isSelected
                    ? 'aetheris-iris-bubble-assistant border-purple-400/50 shadow-[0_12px_36px_rgba(168,85,247,0.18)] ring-1 ring-purple-400/30'
                    : 'bg-white/[0.03] backdrop-blur-md border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                {/* Subtle top reflection rim for selected card */}
                {isSelected && (
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-300/40 to-transparent pointer-events-none" />
                )}

                {/* User Message Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2 text-neutral-200 font-medium">
                    <User className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span className="text-white text-xs select-text font-sans font-medium">{turn.user_message}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 text-[10px] text-neutral-500">
                    <span>{turn.timestamp.slice(11, 19)}</span>
                    {turn.status === 'running' && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5 animate-spin" />
                        <span>running</span>
                      </span>
                    )}
                    {turn.status === 'completed' && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>completed</span>
                      </span>
                    )}
                    {turn.status === 'failed' && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-0.5">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>failed</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Assistant Output or Real Progress */}
                {turn.status === 'running' ? (
                  <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1.5">
                    <div className="flex items-center space-x-2 text-neutral-300">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="font-semibold text-neutral-200">Executing Agent Pipeline...</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      {activeTurnSpansCount > 0
                        ? `Received ${activeTurnSpansCount} live spans over WebSocket. Waiting for final response...`
                        : 'Query submitted to chat server. Waiting for retriever, verifier, and answerer to return...'}
                    </p>
                  </div>
                ) : turn.status === 'failed' ? (
                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-200 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 font-semibold text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Turn Failed</span>
                    </div>
                    <div className="text-[11px] text-rose-200 font-mono whitespace-pre-wrap select-text">
                      {turn.error || 'Execution encountered an unhandled error.'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                    {/* Reply Text */}
                    <div className="text-neutral-200 text-xs select-text leading-relaxed whitespace-pre-wrap bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                      {turn.reply}
                    </div>

                    {/* Metadata Strip: Verifier Verdict & Retrieved Documents */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {turn.verifier_verdict && (
                        <span className="px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                          <span className="text-[10px] text-neutral-400 uppercase font-bold">Verifier:</span>
                          <span className="font-semibold">{turn.verifier_verdict}</span>
                        </span>
                      )}

                      {turn.retrieved && turn.retrieved.length > 0 && (
                        <div className="flex items-center space-x-1 text-neutral-400">
                          <BookOpen className="w-3 h-3 text-neutral-500" />
                          <span className="text-[10px]">Retrieved {turn.retrieved.length} docs:</span>
                          <span className="text-neutral-300 truncate max-w-[200px]" title={turn.retrieved.join(', ')}>
                            {turn.retrieved.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Open Trace Link */}
                      {turn.trace_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToTrace(turn.trace_id!);
                          }}
                          className="ml-auto text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 text-[11px] underline decoration-cyan-500/30 hover:decoration-cyan-400"
                          title={`Open trace ${turn.trace_id} in full Traces investigation view`}
                        >
                          <span>Open trace</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Liquid Glass Composer */}
      <form onSubmit={handleSubmit} className="p-3.5 border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-md relative z-10">
        <div className="relative flex items-center">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              corpusUnreachable
                ? 'Chat server unreachable. Start uvicorn demo.chat_server:app --port 8100'
                : 'Ask a question to test grounding and tool-claim verification (Enter to send)...'
            }
            disabled={isLoading}
            className="w-full bg-black/40 backdrop-blur-md border border-white/[0.14] rounded-xl px-3.5 py-2.5 pr-14 text-xs font-mono text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-400/70 focus:ring-1 focus:ring-purple-400/40 resize-none disabled:opacity-50 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="absolute right-2.5 bottom-2.5 p-2 rounded-xl aetheris-send-button text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            title="Send question (Enter)"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mt-1.5 px-1">
          <span>Press Enter to send, Shift+Enter for newline</span>
          <span className="text-purple-300/80">Target: {CHAT_SERVER_URL}</span>
        </div>
      </form>
    </div>
  );
};
