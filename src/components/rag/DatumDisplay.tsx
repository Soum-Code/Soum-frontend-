import React from 'react';
import { Clock, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Datum } from '../../lib/stateModel';
import { riskTone, riskBadgeClasses, riskLabel } from '../../lib/riskTone';

interface DatumDisplayProps {
  datum: Datum<any>;
  format?: 'risk' | 'latency' | 'percentage' | 'asi' | 'text' | 'stage';
  emptyLabel?: string;
  className?: string;
}

/**
 * Enforces the strict 5 datum states:
 * 1. pending: requested, worker evaluating
 * 2. measured: real value
 * 3. unmeasured: em-dash "—" + tooltip reason
 * 4. unreachable: service did not answer, includes start instruction
 * 5. error: service answered with failure
 */
export const DatumDisplay: React.FC<DatumDisplayProps> = ({
  datum,
  format = 'text',
  className = ''
}) => {
  // 1. Pending State
  if (datum.status === 'pending') {
    return (
      <span
        className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-mono bg-sky-950/40 text-sky-300 border border-sky-500/25 ${className}`}
        title={datum.reason || 'Evaluation in progress'}
      >
        <Clock className="w-3 h-3 animate-spin text-sky-400" />
        <span>Pending</span>
      </span>
    );
  }

  // 2. Unmeasured State (The system does not produce it: em-dash + reason)
  if (datum.status === 'unmeasured') {
    const reason = datum.reason || 'not exposed by the API yet';
    return (
      <span
        className={`group relative inline-flex items-center space-x-1 font-mono text-neutral-500 cursor-help ${className}`}
        title={reason}
      >
        <span>—</span>
        <HelpCircle className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
        <span className="sr-only">({reason})</span>
      </span>
    );
  }

  // 3. Unreachable State
  if (datum.status === 'unreachable') {
    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono bg-rose-950/50 text-rose-300 border border-rose-500/30 ${className}`}
        title={`${datum.service || 'Service'} unreachable. Run: ${datum.instruction || ''}`}
      >
        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
        <span className="truncate">Unreachable</span>
      </span>
    );
  }

  // 4. Error State
  if (datum.status === 'error') {
    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono bg-rose-950/60 text-rose-200 border border-rose-500/40 ${className}`}
        title={datum.error || 'Evaluation failed'}
      >
        <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
        <span className="truncate max-w-[120px]">{datum.error || 'Failed'}</span>
      </span>
    );
  }

  // 5. Measured State (Real number / value)
  const val = datum.value;

  if (format === 'risk') {
    const score = typeof val === 'number' ? val : null;
    const tone = riskTone(score);
    const badge = riskBadgeClasses(tone);
    const label = riskLabel(score);

    return (
      <span
        className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded font-mono text-xs border ${badge.bg} ${badge.text} ${badge.border} ${className}`}
      >
        <span className="font-semibold tabular-nums">{score !== null ? score.toFixed(3) : '—'}</span>
        <span className="text-[10px] uppercase tracking-wider opacity-90 font-medium">({label})</span>
      </span>
    );
  }

  if (format === 'latency') {
    return (
      <span className={`font-mono tabular-nums text-neutral-200 ${className}`}>
        {typeof val === 'number' ? `${val.toFixed(0)} ms` : '—'}
      </span>
    );
  }

  if (format === 'percentage') {
    return (
      <span className={`font-mono tabular-nums text-neutral-200 ${className}`}>
        {typeof val === 'number' ? `${(val * 100).toFixed(1)}%` : '—'}
      </span>
    );
  }

  // Agent Stability Index. The backend scores it 0-100, so it is not a fraction.
  if (format === 'asi') {
    return (
      <span className={`font-mono tabular-nums text-neutral-200 ${className}`}>
        {typeof val === 'number' ? `${val.toFixed(1)} / 100` : '—'}
      </span>
    );
  }

  if (format === 'stage') {
    const stage = String(val).toLowerCase();
    const isStage2 = stage === 'stage2';
    // "skipped" is its own outcome: the evaluator had nothing to check, so it
    // must not read as the embedding stage having run.
    const label = isStage2
      ? 'Stage 2 (NLI)'
      : stage === 'stage1'
      ? 'Stage 1 (Embedding)'
      : stage === 'skipped'
      ? 'Skipped'
      : String(val);
    return (
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
          isStage2
            ? 'bg-purple-950/40 text-purple-300 border-purple-500/30'
            : 'bg-neutral-900 text-neutral-400 border-white/10'
        } ${className}`}
      >
        {label}
      </span>
    );
  }

  return (
    <span className={`font-mono text-neutral-200 ${className}`}>
      {val !== undefined && val !== null ? String(val) : '—'}
    </span>
  );
};
