import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTraceForExport,
  formatTraceLogBody,
  downloadTraceAsJson,
  copyTraceIdToClipboard,
  copyTraceLogBodyToClipboard
} from './traceExport';
import { Trace, Span } from '../types';

describe('traceExport', () => {
  const originalDocument = globalThis.document;
  const originalURL = globalThis.URL;

  const mockSpans: Span[] = [
    {
      id: 'span-1',
      traceId: 'tr-test-123',
      name: 'Agent Coordinator',
      type: 'agent',
      status: 'ok',
      startOffsetMs: 0,
      durationMs: 850,
      tokens: { prompt: 150, completion: 50, total: 200 },
    },
    {
      id: 'span-2',
      traceId: 'tr-test-123',
      parentSpanId: 'span-1',
      name: 'Search Web Tool',
      type: 'tool',
      status: 'error',
      startOffsetMs: 100,
      durationMs: 1200,
      tokens: { prompt: 80, completion: 20, total: 100 },
      error: 'Connection timeout after 1000ms'
    }
  ];

  const mockTrace: Trace = {
    id: 'tr-test-123',
    agentId: 'agent-alpha',
    agentName: 'Alpha Agent',
    sessionId: 'sess-abc-789',
    rootSpanId: 'span-1',
    status: 'error',
    durationMs: 1450,
    totalTokens: 300,
    cost: 0.0042,
    timestamp: '2026-10-19 12:30:00',
    inputPreview: 'Query latest earnings report',
    outputPreview: 'Error occurred during retrieval',
    spans: mockSpans,
    tags: ['production', 'p0-triage'],
    errorSummary: 'Search tool timed out'
  };

  afterEach(() => {
    (globalThis as any).document = originalDocument;
    (globalThis as any).URL = originalURL;
  });

  it('correctly structures the trace export payload according to schema', () => {
    const payload = formatTraceForExport(mockTrace);

    expect(payload.schemaVersion).toBe('agentpulse.trace.v1');
    expect(payload.generator).toBe('AgentPulse Tracing Platform');
    expect(payload.exportedAt).toBeDefined();

    expect(payload.trace.id).toBe('tr-test-123');
    expect(payload.trace.agentName).toBe('Alpha Agent');
    expect(payload.trace.tags).toEqual(['production', 'p0-triage']);

    // Check analysis summary
    expect(payload.trace.analysis.totalSpans).toBe(2);
    expect(payload.trace.analysis.tokenBreakdown).toEqual({
      promptTokens: 230,
      completionTokens: 70,
      totalTokens: 300
    });
    expect(payload.trace.analysis.spansByType).toEqual({
      agent: 1,
      tool: 1
    });
    expect(payload.trace.analysis.slowestSpan?.id).toBe('span-2');
    expect(payload.trace.analysis.slowestSpan?.durationMs).toBe(1200);
    expect(payload.trace.analysis.discrepantSpansCount).toBe(1);

    // Spans list is preserved
    expect(payload.trace.spans).toHaveLength(2);
    expect(payload.trace.spans[1].error).toBe('Connection timeout after 1000ms');
  });

  it('handles traces with zero spans gracefully without failing', () => {
    const emptyTrace: Trace = {
      id: 'tr-empty',
      agentId: 'agent-null',
      agentName: 'Null Agent',
      sessionId: 'sess-none',
      rootSpanId: 'span-0',
      status: 'ok',
      durationMs: 50,
      totalTokens: 0,
      cost: 0,
      timestamp: '2026-10-19 12:00:00',
      inputPreview: 'Hello',
      outputPreview: 'World',
      spans: [],
      tags: []
    };

    const payload = formatTraceForExport(emptyTrace);
    expect(payload.trace.analysis.totalSpans).toBe(0);
    expect(payload.trace.analysis.slowestSpan).toBeNull();
    expect(payload.trace.analysis.discrepantSpansCount).toBe(0);
    expect(payload.trace.analysis.tokenBreakdown.totalTokens).toBe(0);
  });

  it('triggers download with proper URL and anchor setup', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/mock-blob');
    const revokeObjectURLMock = vi.fn();
    (globalThis as any).URL = {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    };

    const mockAnchor = {
      setAttribute: vi.fn(),
      click: vi.fn(),
    };
    const appendChildMock = vi.fn();
    const removeChildMock = vi.fn();

    (globalThis as any).document = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
      body: {
        appendChild: appendChildMock,
        removeChild: removeChildMock,
      },
    };

    const result = downloadTraceAsJson(mockTrace);
    expect(result).toBe(true);
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(mockAnchor.setAttribute).toHaveBeenCalledWith('href', 'blob:http://localhost/mock-blob');
    expect(mockAnchor.setAttribute).toHaveBeenCalledWith(
      'download',
      expect.stringMatching(/^agent-trace-tr-test-123-\d{4}-\d{2}-\d{2}\.json$/)
    );
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(appendChildMock).toHaveBeenCalledWith(mockAnchor);
    expect(removeChildMock).toHaveBeenCalledWith(mockAnchor);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/mock-blob');
  });

  it('returns false when document is undefined or trace is invalid', () => {
    (globalThis as any).document = undefined;
    expect(downloadTraceAsJson(mockTrace)).toBe(false);
    expect(downloadTraceAsJson(null as any)).toBe(false);
  });

  it('correctly serializes trace log body into formatted JSON string', () => {
    const raw = formatTraceLogBody(mockTrace, true);
    expect(raw).toContain('"schemaVersion": "agentpulse.trace.v1"');
    expect(raw).toContain('"id": "tr-test-123"');
    expect(raw).toContain('"spans": [');

    const parsed = JSON.parse(raw);
    expect(parsed.trace.id).toBe('tr-test-123');
    expect(parsed.trace.agentName).toBe('Alpha Agent');
    expect(parsed.trace.spans).toHaveLength(2);
  });

  it('copies trace ID and log body to clipboard using navigator.clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    const originalClipboard = navigator.clipboard;

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    try {
      const idResult = await copyTraceIdToClipboard('tr-test-123');
      expect(idResult).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('tr-test-123');

      const logResult = await copyTraceLogBodyToClipboard(mockTrace);
      expect(logResult).toBe(true);
      expect(writeTextMock).toHaveBeenLastCalledWith(expect.stringContaining('"id": "tr-test-123"'));
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
        writable: true,
      });
    }
  });
});
