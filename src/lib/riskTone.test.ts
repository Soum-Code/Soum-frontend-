import { describe, it, expect } from 'vitest';
import { riskTone, riskLabel, riskBadgeClasses } from './riskTone';

describe('riskTone', () => {
  it('classifies low risk scores (<= 0.4) as ok / Grounded', () => {
    expect(riskTone(0.0)).toBe('ok');
    expect(riskTone(0.1)).toBe('ok');
    expect(riskTone(0.25)).toBe('ok');
    expect(riskTone(0.4)).toBe('ok');

    expect(riskLabel(0.0)).toBe('Grounded');
    expect(riskLabel(0.4)).toBe('Grounded');
    expect(riskBadgeClasses('ok').text).toContain('emerald');
  });

  it('classifies medium risk scores (> 0.4 and <= 0.7) as warn / Uncertain', () => {
    expect(riskTone(0.4001)).toBe('warn');
    expect(riskTone(0.5)).toBe('warn');
    expect(riskTone(0.65)).toBe('warn');
    expect(riskTone(0.7)).toBe('warn');

    expect(riskLabel(0.5)).toBe('Uncertain');
    expect(riskLabel(0.7)).toBe('Uncertain');
    expect(riskBadgeClasses('warn').text).toContain('amber');
  });

  it('classifies high risk scores (> 0.7) as bad / Ungrounded', () => {
    expect(riskTone(0.7001)).toBe('bad');
    expect(riskTone(0.85)).toBe('bad');
    expect(riskTone(0.95)).toBe('bad');
    expect(riskTone(1.0)).toBe('bad');

    expect(riskLabel(0.95)).toBe('Ungrounded');
    expect(riskLabel(1.0)).toBe('Ungrounded');
    expect(riskBadgeClasses('bad').text).toContain('rose');
  });

  it('classifies null, undefined, or NaN as unmeasured', () => {
    expect(riskTone(null)).toBe('unmeasured');
    expect(riskTone(undefined)).toBe('unmeasured');
    expect(riskTone(NaN)).toBe('unmeasured');

    expect(riskLabel(null)).toBe('Unmeasured');
    expect(riskLabel(undefined)).toBe('Unmeasured');
    expect(riskBadgeClasses('unmeasured').text).toContain('neutral');
  });
});
