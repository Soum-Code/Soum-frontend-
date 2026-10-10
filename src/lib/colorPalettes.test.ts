import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  CHALK_PRESETS,
  DARK_PRESETS,
  BUTTER_PRESETS,
  getPresetConfig,
  getLuminance,
  getContrastRatio,
  applyThemeVariables,
} from './colorPalettes';

describe('colorPalettes', () => {
  let mockStyle: Record<string, string> = {};
  const originalDocument = globalThis.document;

  beforeEach(() => {
    mockStyle = {};
    (globalThis as unknown as { document: unknown }).document = {
      documentElement: {
        style: {
          setProperty: (k: string, v: string) => {
            mockStyle[k] = v;
          },
          getPropertyValue: (k: string) => mockStyle[k] || '',
        },
        removeAttribute: () => {},
        setAttribute: () => {},
      },
    };
  });

  afterEach(() => {
    (globalThis as unknown as { document: unknown }).document = originalDocument;
  });

  describe('presets configuration', () => {
    it('has multi-color presets defined for chalk, dark, and butter', () => {
      expect(CHALK_PRESETS.length).toBeGreaterThanOrEqual(4);
      expect(DARK_PRESETS.length).toBeGreaterThanOrEqual(4);
      expect(BUTTER_PRESETS.length).toBeGreaterThanOrEqual(4);
    });

    it('returns preset config by id for each palette', () => {
      expect(getPresetConfig('chalk', 'blueprint-mist')?.name).toBe('Blueprint Mist');
      expect(getPresetConfig('dark', 'midnight-sapphire')?.name).toBe('Midnight Sapphire');
      expect(getPresetConfig('butter', 'amber-honey')?.name).toBe('Toasted Amber Honey');
    });

    it('computes relative luminance and contrast ratio accurately', () => {
      const whiteLum = getLuminance('#ffffff');
      const blackLum = getLuminance('#000000');
      expect(whiteLum).toBeCloseTo(1, 1);
      expect(blackLum).toBeCloseTo(0, 1);

      const contrast = getContrastRatio('#ffffff', '#000000');
      expect(contrast).toBeCloseTo(21, 0);
    });
  });

  describe('applyThemeVariables', () => {
    it('applies dark preset tokens dynamically to documentElement style', () => {
      applyThemeVariables('dark', 'midnight-sapphire');

      expect(mockStyle['--theme-bg']).toBe('#030712');
      expect(mockStyle['--theme-accent']).toBe('#3b82f6');
      expect(mockStyle['--dark-surface-bg']).toBe('#030712');
      expect(mockStyle['--lg-card-border']).toBeTruthy();
      expect(mockStyle['--lg-pill-bg']).toBeTruthy();
    });

    it('applies butter preset tokens dynamically to documentElement style', () => {
      applyThemeVariables('butter', 'canary-gold');

      expect(mockStyle['--theme-bg']).toBe('#faf5e6');
      expect(mockStyle['--theme-accent']).toBe('#d97706');
      expect(mockStyle['--butter-surface-bg']).toBe('#faf5e6');
      expect(mockStyle['--theme-text-primary']).toBe('#1c1917');
    });

    it('applies chalk preset tokens dynamically to documentElement style', () => {
      applyThemeVariables('chalk', 'sepia-slate');

      expect(mockStyle['--theme-bg']).toBe('#f5efe4');
      expect(mockStyle['--theme-accent']).toBe('#b45309');
      expect(mockStyle['--chalk-surface-bg']).toBe('#f5efe4');
      expect(mockStyle['--theme-text-primary']).toBe('#0f172a');
    });

    it('applies custom user-specified colors seamlessly', () => {
      applyThemeVariables('dark', 'custom', '#1a0933');

      expect(mockStyle['--theme-bg']).toBe('#1a0933');
      expect(mockStyle['--dark-surface-bg']).toBe('#1a0933');
      expect(mockStyle['--lg-card-bg']).toContain('#1a0933');
    });
  });
});
