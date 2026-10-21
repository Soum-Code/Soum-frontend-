import { Trace, Span } from '../types';

export interface TraceExportPayload {
  schemaVersion: 'agentpulse.trace.v1';
  exportedAt: string;
  generator: string;
  trace: {
    id: string;
    agentId: string;
    agentName: string;
    sessionId: string;
    rootSpanId: string;
    status: 'ok' | 'warning' | 'error';
    durationMs: number;
    totalTokens: number;
    cost: number;
    timestamp: string;
    inputPreview: string;
    outputPreview: string;
    tags: string[];
    errorSummary?: string | null;
    driftDetected?: boolean;
    groundingScore?: number | null;
    evaluators?: any[];
    analysis: {
      totalSpans: number;
      tokenBreakdown: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      };
      spansByType: Record<string, number>;
      slowestSpan: {
        id: string;
        name: string;
        type: string;
        durationMs: number;
      } | null;
      discrepantSpansCount: number;
    };
    spans: Span[];
  };
}

/**
 * Formats a single trace into a structured, schema-compliant JSON payload for offline analysis.
 */
export function formatTraceForExport(trace: Trace): TraceExportPayload {
  const spans = trace.spans || [];
  const promptTokens = spans.reduce((acc, s) => acc + (s.tokens?.prompt || 0), 0);
  const completionTokens = spans.reduce((acc, s) => acc + (s.tokens?.completion || 0), 0);

  const slowestSpan = spans.length > 0
    ? [...spans].sort((a, b) => b.durationMs - a.durationMs)[0]
    : null;

  const errorSpans = spans.filter(s => s.status === 'error' || s.status === 'warning');

  const spansByType = spans.reduce((acc, span) => {
    acc[span.type] = (acc[span.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    schemaVersion: 'agentpulse.trace.v1',
    exportedAt: new Date().toISOString(),
    generator: 'AgentPulse Tracing Platform',
    trace: {
      id: trace.id,
      agentId: trace.agentId,
      agentName: trace.agentName,
      sessionId: trace.sessionId,
      rootSpanId: trace.rootSpanId,
      status: trace.status,
      durationMs: trace.durationMs,
      totalTokens: trace.totalTokens,
      cost: trace.cost,
      timestamp: trace.timestamp,
      inputPreview: trace.inputPreview,
      outputPreview: trace.outputPreview,
      tags: trace.tags || [],
      errorSummary: trace.errorSummary || null,
      driftDetected: trace.driftDetected || false,
      groundingScore: trace.groundingScore ?? null,
      evaluators: (trace as any).evaluators || [],
      analysis: {
        totalSpans: spans.length,
        tokenBreakdown: {
          promptTokens,
          completionTokens,
          totalTokens: trace.totalTokens,
        },
        spansByType,
        slowestSpan: slowestSpan ? {
          id: slowestSpan.id,
          name: slowestSpan.name,
          type: slowestSpan.type,
          durationMs: slowestSpan.durationMs
        } : null,
        discrepantSpansCount: errorSpans.length
      },
      spans
    }
  };
}

/**
 * Triggers a browser download of a formatted trace JSON file.
 * Returns true if the download was initiated, false otherwise.
 */
export function downloadTraceAsJson(trace: Trace, customFilename?: string): boolean {
  if (!trace) return false;

  try {
    const payload = formatTraceForExport(trace);
    const jsonString = JSON.stringify(payload, null, 2);

    if (typeof document === 'undefined') {
      return false;
    }

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = customFilename || `agent-trace-${trace.id}-${dateStr}.json`;
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to export trace JSON:', err);
    return false;
  }
}

/**
 * Serializes a trace's complete telemetry and span tree into a formatted JSON log string.
 */
export function formatTraceLogBody(trace: Trace, pretty: boolean = true): string {
  if (!trace) return '';
  const payload = formatTraceForExport(trace);
  return JSON.stringify(payload, null, pretty ? 2 : 0);
}

/**
 * Safely copies text to the system clipboard using the Clipboard API with fallback.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Copies a trace identifier to the clipboard.
 */
export async function copyTraceIdToClipboard(traceId: string): Promise<boolean> {
  return copyTextToClipboard(traceId);
}

/**
 * Copies a complete trace log body (full JSON including spans and diagnostics) to the clipboard.
 */
export async function copyTraceLogBodyToClipboard(trace: Trace, pretty: boolean = true): Promise<boolean> {
  if (!trace) return false;
  const formattedJson = formatTraceLogBody(trace, pretty);
  return copyTextToClipboard(formattedJson);
}
