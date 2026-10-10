/**
 * Risk tone calculation for AgentPulse evaluator scores.
 * 
 * CRITICAL SCORE SEMANTICS:
 * Every score the evaluator produces is a RISK: 0.0 is good, 1.0 is bad.
 * 
 * - grounding_score: NLI contradiction + 0.5 * neutral against evidence (0.0 = grounded, 1.0 = ungrounded)
 * - tool_claim_score: agent's claim vs tool's real result (0.0 = claim matched, 1.0 = claim wrong)
 * - overall_risk_score: weighted blend (0.0 = low risk, 1.0 = high risk)
 * 
 * Risk Tone Mapping:
 * - score > 0.7 => 'bad' (High Risk)
 * - score > 0.4 => 'warn' (Medium Risk / Uncertain)
 * - score <= 0.4 => 'ok' (Low Risk / Grounded)
 * - null / undefined / NaN => 'unmeasured'
 */

export type RiskTone = 'ok' | 'warn' | 'bad' | 'unmeasured';

export function riskTone(score: number | null | undefined): RiskTone {
  if (score === null || score === undefined || typeof score !== 'number' || isNaN(score)) {
    return 'unmeasured';
  }
  return score > 0.7 ? 'bad' : score > 0.4 ? 'warn' : 'ok';
}

export function riskLabel(score: number | null | undefined): string {
  const tone = riskTone(score);
  switch (tone) {
    case 'ok':
      return 'Grounded';
    case 'warn':
      return 'Uncertain';
    case 'bad':
      return 'Ungrounded';
    case 'unmeasured':
      return 'Unmeasured';
  }
}

export function riskBadgeClasses(tone: RiskTone): { text: string; bg: string; border: string } {
  switch (tone) {
    case 'ok':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-950/50',
        border: 'border-emerald-500/30'
      };
    case 'warn':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-950/50',
        border: 'border-amber-500/30'
      };
    case 'bad':
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-950/50',
        border: 'border-rose-500/30'
      };
    case 'unmeasured':
      return {
        text: 'text-neutral-400',
        bg: 'bg-neutral-900/50',
        border: 'border-white/10'
      };
  }
}
