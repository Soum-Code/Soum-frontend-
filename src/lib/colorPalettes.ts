import {
  ColorPalette,
  ChalkSurfacePreset,
  DarkSurfacePreset,
  ButterSurfacePreset,
  SurfacePresetConfig,
  ChalkTextMetrics,
} from '../types';

export const CHALK_PRESETS: SurfacePresetConfig[] = [
  {
    id: 'classic-white',
    name: 'Classic White',
    label: 'Alabaster',
    subtitle: 'Studio alabaster & fresh drafting paper',
    bgHex: '#f6f8fb',
    cardHex: '#ffffff',
    borderHex: '#cbd5e1',
    accentHex: '#0284c7',
    tag: 'Crisp & Clean',
    textBaseRgb: '15, 23, 42',
    textOpacityPrimary: 0.96,
    textOpacitySecondary: 0.82,
    textOpacityMuted: 0.68,
  },
  {
    id: 'sepia-slate',
    name: 'Sepia-Toned Slate',
    label: 'Sepia',
    subtitle: 'Warm antique parchment & library stone',
    bgHex: '#f5efe4',
    cardHex: '#fcfaf4',
    borderHex: '#d8cdbf',
    accentHex: '#b45309',
    tag: 'Eye Comfort',
    textBaseRgb: '35, 24, 15',
    textOpacityPrimary: 0.97,
    textOpacitySecondary: 0.84,
    textOpacityMuted: 0.70,
  },
  {
    id: 'emerald-graphite',
    name: 'Soft Emerald-Graphite',
    label: 'Emerald',
    subtitle: 'Matte lecture slate & calming sage tone',
    bgHex: '#ebf3ed',
    cardHex: '#f6faf7',
    borderHex: '#c4d6c9',
    accentHex: '#059669',
    tag: 'Academic Slate',
    textBaseRgb: '13, 36, 25',
    textOpacityPrimary: 0.97,
    textOpacitySecondary: 0.83,
    textOpacityMuted: 0.69,
  },
  {
    id: 'blueprint-mist',
    name: 'Blueprint Mist',
    label: 'Blueprint',
    subtitle: 'Architectural cyan wash & draftsman paper',
    bgHex: '#e7eff7',
    cardHex: '#f5f9fd',
    borderHex: '#bfd6ee',
    accentHex: '#2563eb',
    tag: 'Technical Draft',
    textBaseRgb: '15, 39, 68',
    textOpacityPrimary: 0.98,
    textOpacitySecondary: 0.85,
    textOpacityMuted: 0.72,
  },
];

export const DARK_PRESETS: SurfacePresetConfig[] = [
  {
    id: 'obsidian-void',
    name: 'Cyber Obsidian',
    label: 'Obsidian',
    subtitle: 'Pure atmospheric void & prismatic ice cyan',
    bgHex: '#06070a',
    cardHex: '#0e1117',
    borderHex: 'rgba(255, 255, 255, 0.10)',
    accentHex: '#38bdf8',
    tag: 'Flagship Void',
  },
  {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire',
    label: 'Sapphire',
    subtitle: 'Deep oceanic abyss & luminous cobalt azure',
    bgHex: '#030712',
    cardHex: '#071328',
    borderHex: 'rgba(59, 130, 246, 0.28)',
    accentHex: '#3b82f6',
    tag: 'Deep Ocean',
  },
  {
    id: 'amethyst-abyss',
    name: 'Amethyst Abyss',
    label: 'Amethyst',
    subtitle: 'Imperial violet nebula & electric iris prism',
    bgHex: '#070210',
    cardHex: '#140827',
    borderHex: 'rgba(168, 85, 247, 0.28)',
    accentHex: '#a855f7',
    tag: 'Cosmic Iris',
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    label: 'Matrix',
    subtitle: 'Cyber forest obsidian & radioactive mint',
    bgHex: '#020d07',
    cardHex: '#061c12',
    borderHex: 'rgba(16, 185, 129, 0.28)',
    accentHex: '#10b981',
    tag: 'Cyber Jade',
  },
];

export const BUTTER_PRESETS: SurfacePresetConfig[] = [
  {
    id: 'canary-gold',
    name: 'Buttermax Canary',
    label: 'Canary',
    subtitle: 'Warm churned buttermilk & golden honey crest',
    bgHex: '#faf5e6',
    cardHex: '#ffffff',
    borderHex: '#ead7af',
    accentHex: '#d97706',
    tag: 'Buttermax Signature',
  },
  {
    id: 'amber-honey',
    name: 'Toasted Amber Honey',
    label: 'Honey',
    subtitle: 'Warm roasted honeycomb & dark caramel glaze',
    bgHex: '#f7efe1',
    cardHex: '#ffffff',
    borderHex: '#e8ceba',
    accentHex: '#c2410c',
    tag: 'Golden Amber',
  },
  {
    id: 'vanilla-creme',
    name: 'French Vanilla',
    label: 'Vanilla',
    subtitle: 'Silky whipped french cream & roasted espresso',
    bgHex: '#f6f2ea',
    cardHex: '#ffffff',
    borderHex: '#dfd5c7',
    accentHex: '#92400e',
    tag: 'Velvet Bisque',
  },
  {
    id: 'pistachio-mint',
    name: 'Matcha Pistachio',
    label: 'Pistachio',
    subtitle: 'Delicate whipped matcha cream & soothing jade',
    bgHex: '#edf5ee',
    cardHex: '#ffffff',
    borderHex: '#c8dcce',
    accentHex: '#15803d',
    tag: 'Matcha Crema',
  },
];

export const CHALK_SWATCHES = [
  { hex: '#f6f8fb', name: 'Alabaster' },
  { hex: '#f5efe4', name: 'Sepia Parchment' },
  { hex: '#ebf3ed', name: 'Sage Slate' },
  { hex: '#e7eff7', name: 'Blueprint Cyan' },
  { hex: '#eee8f5', name: 'Lilac Vellum' },
  { hex: '#f5eee8', name: 'Limestone Sand' },
];

export const DARK_SWATCHES = [
  { hex: '#06070a', name: 'Obsidian Void' },
  { hex: '#030712', name: 'Midnight Navy' },
  { hex: '#06020f', name: 'Amethyst Void' },
  { hex: '#020d07', name: 'Emerald Pine' },
  { hex: '#0d0714', name: 'Plum Nebula' },
  { hex: '#090a0f', name: 'Steel Carbon' },
];

export const BUTTER_SWATCHES = [
  { hex: '#faf5e6', name: 'Canary Buttermilk' },
  { hex: '#f7efe1', name: 'Amber Honey' },
  { hex: '#f6f2ea', name: 'French Vanilla' },
  { hex: '#edf5ee', name: 'Matcha Crema' },
  { hex: '#fcf5eb', name: 'Golden Brioche' },
  { hex: '#f9f1e4', name: 'Caramel Bisque' },
];

export function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return 1;
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((c) => c + c)
          .join('')
      : cleanHex;
  const r = parseInt(fullHex.substring(0, 2), 16) / 255;
  const g = parseInt(fullHex.substring(2, 4), 16) / 255;
  const b = parseInt(fullHex.substring(4, 6), 16) / 255;
  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Computes contrast ratio of text with alpha opacity composited onto a solid background.
 * Uses official W3C WCAG 2.1 relative luminance and contrast formula.
 */
export function getBlendedContrastRatio(
  textHexOrRgb: string,
  alpha: number,
  bgHex: string
): number {
  let tr = 15;
  let tg = 23;
  let tb = 42;

  if (textHexOrRgb.includes(',')) {
    const parts = textHexOrRgb.split(',').map((p) => parseInt(p.trim(), 10));
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      tr = parts[0];
      tg = parts[1];
      tb = parts[2];
    }
  } else {
    const cleanText = textHexOrRgb.replace('#', '');
    if (cleanText.length === 6) {
      tr = parseInt(cleanText.substring(0, 2), 16);
      tg = parseInt(cleanText.substring(2, 4), 16);
      tb = parseInt(cleanText.substring(4, 6), 16);
    }
  }

  const cleanBg = bgHex.replace('#', '');
  let bgr = 246;
  let bgg = 248;
  let bgb = 251;
  if (cleanBg.length === 6) {
    bgr = parseInt(cleanBg.substring(0, 2), 16);
    bgg = parseInt(cleanBg.substring(2, 4), 16);
    bgb = parseInt(cleanBg.substring(4, 6), 16);
  }

  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const compR = Math.round(tr * clampedAlpha + bgr * (1 - clampedAlpha));
  const compG = Math.round(tg * clampedAlpha + bgg * (1 - clampedAlpha));
  const compB = Math.round(tb * clampedAlpha + bgb * (1 - clampedAlpha));

  const compHex =
    '#' +
    [compR, compG, compB]
      .map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0'))
      .join('');

  return getContrastRatio(compHex, bgHex);
}

/**
 * Calculates dynamically tuned text opacity tokens for Chalk presets,
 * ensuring strict WCAG 2.1 AA compliance (>= 4.5:1 for normal text).
 */
export function getChalkTextMetrics(
  presetId: string,
  customColor?: string
): ChalkTextMetrics {
  let baseRgb = '15, 23, 42';
  let opacityPrimary = 0.96;
  let opacitySecondary = 0.82;
  let opacityMuted = 0.68;
  let surfaceBg = '#f6f8fb';

  if (presetId === 'custom' && customColor) {
    surfaceBg = customColor;
    const bgLum = getLuminance(customColor);
    if (bgLum < 0.25) {
      // Dark custom background
      baseRgb = '248, 250, 252';
      opacityPrimary = 0.98;
      opacitySecondary = 0.86;
      opacityMuted = 0.72;
    } else {
      // Light custom background
      baseRgb = '15, 23, 42';
      const lumDeficit = Math.max(0, 0.94 - bgLum);
      opacityPrimary = 0.98;
      opacitySecondary = Math.min(0.92, Math.max(0.80, 0.82 + lumDeficit * 0.4));
      opacityMuted = Math.min(0.85, Math.max(0.68, 0.68 + lumDeficit * 0.6));
    }
  } else {
    const preset = CHALK_PRESETS.find((p) => p.id === presetId) || CHALK_PRESETS[0];
    surfaceBg = preset.bgHex;
    baseRgb = preset.textBaseRgb || '15, 23, 42';
    opacityPrimary = preset.textOpacityPrimary ?? 0.96;
    opacitySecondary = preset.textOpacitySecondary ?? 0.82;
    opacityMuted = preset.textOpacityMuted ?? 0.68;
  }

  // Ensure WCAG 2.1 AA compliance: muted text must have contrast ratio >= 4.5:1
  let contrastMuted = getBlendedContrastRatio(baseRgb, opacityMuted, surfaceBg);
  while (contrastMuted < 4.5 && opacityMuted < 1.0) {
    opacityMuted = Math.min(1.0, +(opacityMuted + 0.02).toFixed(2));
    contrastMuted = getBlendedContrastRatio(baseRgb, opacityMuted, surfaceBg);
  }

  let contrastSecondary = getBlendedContrastRatio(baseRgb, opacitySecondary, surfaceBg);
  while (contrastSecondary < 4.5 && opacitySecondary < 1.0) {
    opacitySecondary = Math.min(1.0, +(opacitySecondary + 0.02).toFixed(2));
    contrastSecondary = getBlendedContrastRatio(baseRgb, opacitySecondary, surfaceBg);
  }

  const contrastPrimary = getBlendedContrastRatio(baseRgb, opacityPrimary, surfaceBg);

  return {
    baseRgb,
    opacityPrimary,
    opacitySecondary,
    opacityMuted,
    textPrimary: `rgba(${baseRgb}, ${opacityPrimary})`,
    textSecondary: `rgba(${baseRgb}, ${opacitySecondary})`,
    textMuted: `rgba(${baseRgb}, ${opacityMuted})`,
    contrastRatioPrimary: contrastPrimary,
    contrastRatioSecondary: contrastSecondary,
    contrastRatioMuted: contrastMuted,
    isWcagAACompliant: contrastMuted >= 4.5 && contrastSecondary >= 4.5 && contrastPrimary >= 4.5,
  };
}

export function getPresetConfig(
  palette: ColorPalette,
  presetId: string
): SurfacePresetConfig | undefined {
  if (palette === 'chalk') {
    return CHALK_PRESETS.find((p) => p.id === presetId);
  }
  if (palette === 'butter') {
    return BUTTER_PRESETS.find((p) => p.id === presetId);
  }
  return DARK_PRESETS.find((p) => p.id === presetId);
}

export function applyThemeVariables(
  palette: ColorPalette,
  presetId: string,
  customColor?: string
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  let bgHex = '#06070a';
  let cardHex = '#0d1117';
  let borderHex = 'rgba(255, 255, 255, 0.14)';
  let accentHex = '#38bdf8';
  let glowHex = 'rgba(56, 189, 248, 0.25)';
  let textPrimary = '#F5F5F7';
  let textSecondary = '#9ea3b0';
  let textMuted = '#626775';
  let cardGradient = '';
  let headerGradient = '';

  if (palette === 'chalk') {
    let borderHover = '#94a3b8';
    if (presetId === 'custom' && customColor) {
      bgHex = customColor;
      cardHex = '#ffffff';
      borderHex = 'rgba(15, 23, 42, 0.16)';
      borderHover = 'rgba(15, 23, 42, 0.28)';
      accentHex = '#0284c7';
      glowHex = 'rgba(2, 132, 199, 0.20)';
      cardGradient = `linear-gradient(135deg, #ffffff 0%, ${customColor} 100%)`;
      headerGradient = `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, ${customColor}ea 100%)`;
    } else {
      const preset = CHALK_PRESETS.find((p) => p.id === presetId) || CHALK_PRESETS[0];
      bgHex = preset.bgHex;
      cardHex = preset.cardHex;
      borderHex = preset.borderHex;
      borderHover =
        preset.id === 'sepia-slate'
          ? '#b8a794'
          : preset.id === 'emerald-graphite'
          ? '#95b39c'
          : preset.id === 'blueprint-mist'
          ? '#93c5fd'
          : '#94a3b8';
      accentHex = preset.accentHex;
      glowHex = `${preset.accentHex}33`;
      cardGradient = `linear-gradient(135deg, #ffffff 0%, ${preset.bgHex} 100%)`;
      headerGradient = `linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, ${preset.bgHex}ea 100%)`;
    }
    textPrimary = '#0f172a';
    textSecondary = '#334155';
    textMuted = '#64748b';

    const metrics = getChalkTextMetrics(presetId, customColor);

    root.style.setProperty('--chalk-surface-bg', bgHex);
    root.style.setProperty('--chalk-header-bg', `${bgHex}f0`);
    root.style.setProperty('--chalk-card-bg', cardHex);
    root.style.setProperty('--chalk-border', borderHex);
    root.style.setProperty('--chalk-border-hover', borderHover);
    root.style.setProperty('--chalk-accent', accentHex);
    root.style.setProperty('--chalk-card-gradient', cardGradient);
    root.style.setProperty('--chalk-header-gradient', headerGradient);

    // Dynamic Chalk Text Legibility variables (WCAG 2.1 AA compliant)
    root.style.setProperty('--chalk-text-base-rgb', metrics.baseRgb);
    root.style.setProperty('--chalk-text-opacity-primary', metrics.opacityPrimary.toString());
    root.style.setProperty('--chalk-text-opacity-secondary', metrics.opacitySecondary.toString());
    root.style.setProperty('--chalk-text-opacity-muted', metrics.opacityMuted.toString());
    root.style.setProperty('--chalk-text-primary', metrics.textPrimary);
    root.style.setProperty('--chalk-text-secondary', metrics.textSecondary);
    root.style.setProperty('--chalk-text-muted', metrics.textMuted);
    root.style.setProperty('--theme-text-opacity-primary', metrics.opacityPrimary.toString());
    root.style.setProperty('--theme-text-opacity-secondary', metrics.opacitySecondary.toString());
    root.style.setProperty('--theme-text-opacity-muted', metrics.opacityMuted.toString());
    root.style.setProperty('--chalk-header-gradient', headerGradient);
  } else if (palette === 'butter') {
    if (presetId === 'custom' && customColor) {
      bgHex = customColor;
      cardHex = '#ffffff';
      borderHex = 'rgba(217, 119, 6, 0.22)';
      accentHex = '#d97706';
      glowHex = 'rgba(245, 158, 11, 0.25)';
      cardGradient = `linear-gradient(135deg, #ffffff 0%, ${customColor} 100%)`;
      headerGradient = `linear-gradient(180deg, rgba(255,255,255,0.92) 0%, ${customColor}ea 100%)`;
    } else {
      const preset = BUTTER_PRESETS.find((p) => p.id === presetId) || BUTTER_PRESETS[0];
      bgHex = preset.bgHex;
      cardHex = preset.cardHex;
      borderHex = preset.borderHex;
      accentHex = preset.accentHex;
      glowHex = `${preset.accentHex}33`;
      cardGradient = `linear-gradient(135deg, #ffffff 0%, ${preset.bgHex} 100%)`;
      headerGradient = `linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, ${preset.bgHex}f0 100%)`;
    }
    textPrimary = '#1c1917';
    textSecondary = '#44403c';
    textMuted = '#78716c';

    root.style.setProperty('--butter-surface-bg', bgHex);
    root.style.setProperty('--butter-header-bg', `${bgHex}f0`);
    root.style.setProperty('--butter-card-bg', cardHex);
    root.style.setProperty('--butter-border', borderHex);
    root.style.setProperty('--butter-accent', accentHex);
    root.style.setProperty('--butter-card-gradient', cardGradient);
    root.style.setProperty('--butter-header-gradient', headerGradient);
  } else {
    // Dark palette
    if (presetId === 'custom' && customColor) {
      bgHex = customColor;
      cardHex = customColor;
      borderHex = 'rgba(255, 255, 255, 0.14)';
      accentHex = '#38bdf8';
      glowHex = 'rgba(56, 189, 248, 0.25)';
      cardGradient = `linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, ${customColor} 100%)`;
      headerGradient = `linear-gradient(180deg, ${customColor}f0 0%, ${customColor}d0 100%)`;
    } else {
      const preset = DARK_PRESETS.find((p) => p.id === presetId) || DARK_PRESETS[0];
      bgHex = preset.bgHex;
      cardHex = preset.cardHex;
      borderHex = preset.borderHex;
      accentHex = preset.accentHex;
      glowHex = `${preset.accentHex}35`;
      cardGradient = `linear-gradient(145deg, rgba(255, 255, 255, 0.07) 0%, ${preset.cardHex} 50%, ${preset.bgHex} 100%)`;
      headerGradient = `linear-gradient(180deg, ${preset.bgHex}f5 0%, ${preset.bgHex}cc 100%)`;
    }
    textPrimary = '#F5F5F7';
    textSecondary = '#9ea3b0';
    textMuted = '#626775';

    root.style.setProperty('--dark-surface-bg', bgHex);
    root.style.setProperty('--dark-card-bg', cardHex);
    root.style.setProperty('--dark-border', borderHex);
    root.style.setProperty('--dark-accent', accentHex);
    root.style.setProperty('--dark-card-gradient', cardGradient);
    root.style.setProperty('--dark-header-gradient', headerGradient);
  }

  // Unified theme tokens across website, chat, and dashboard
  root.style.setProperty('--theme-bg', bgHex);
  root.style.setProperty('--theme-card-bg', cardHex);
  root.style.setProperty('--theme-border', borderHex);
  root.style.setProperty('--theme-accent', accentHex);
  root.style.setProperty('--theme-glow', glowHex);
  root.style.setProperty('--theme-text-primary', textPrimary);
  root.style.setProperty('--theme-text-secondary', textSecondary);
  root.style.setProperty('--theme-text-muted', textMuted);

  // Dynamic Liquid Glass tokens
  if (palette === 'dark') {
    root.style.setProperty(
      '--lg-card-bg',
      cardGradient || `linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, ${cardHex}b3 40%, ${bgHex}e6 100%)`
    );
    root.style.setProperty(
      '--lg-card-hover-bg',
      `linear-gradient(145deg, rgba(255, 255, 255, 0.13) 0%, ${cardHex}d9 40%, ${bgHex}f2 100%)`
    );
    root.style.setProperty('--lg-card-border', borderHex);
    root.style.setProperty('--lg-card-border-hover', 'rgba(255, 255, 255, 0.32)');
    root.style.setProperty('--lg-card-shadow', '0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 8px 16px -4px rgba(0, 0, 0, 0.4)');
    root.style.setProperty('--lg-card-bevel', 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.38)');
    root.style.setProperty('--lg-pill-bg', 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)');
    root.style.setProperty('--lg-pill-border', 'rgba(255, 255, 255, 0.16)');
    root.style.setProperty('--lg-pill-text', '#F5F5F7');
    root.style.setProperty('--lg-header-bg', headerGradient || `linear-gradient(180deg, ${bgHex}e0 0%, ${bgHex}cc 100%)`);
    root.style.setProperty('--lg-header-border', 'rgba(255, 255, 255, 0.14)');
  } else if (palette === 'butter') {
    root.style.setProperty(
      '--lg-card-bg',
      cardGradient || 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 245, 230, 0.88) 100%)'
    );
    root.style.setProperty(
      '--lg-card-hover-bg',
      'linear-gradient(135deg, #ffffff 0%, rgba(254, 249, 235, 0.95) 100%)'
    );
    root.style.setProperty('--lg-card-border', borderHex || 'rgba(217, 119, 6, 0.22)');
    root.style.setProperty('--lg-card-border-hover', 'rgba(180, 83, 9, 0.45)');
    root.style.setProperty('--lg-card-shadow', '0 16px 36px -8px rgba(180, 83, 9, 0.08), 0 4px 12px -2px rgba(180, 83, 9, 0.04)');
    root.style.setProperty('--lg-card-bevel', 'inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--lg-pill-bg', 'linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 245, 230, 0.8) 100%)');
    root.style.setProperty('--lg-pill-border', 'rgba(217, 119, 6, 0.25)');
    root.style.setProperty('--lg-pill-text', '#1c1917');
    root.style.setProperty('--lg-header-bg', headerGradient || `linear-gradient(180deg, ${bgHex}f2 0%, ${bgHex}e0 100%)`);
    root.style.setProperty('--lg-header-border', 'rgba(217, 119, 6, 0.20)');
  } else {
    // Chalk
    const borderHover =
      presetId === 'sepia-slate'
        ? '#b8a794'
        : presetId === 'emerald-graphite'
        ? '#95b39c'
        : presetId === 'blueprint-mist'
        ? '#93c5fd'
        : '#94a3b8';

    root.style.setProperty(
      '--lg-card-bg',
      cardGradient || 'linear-gradient(135deg, #ffffff 0%, rgba(241, 245, 249, 0.90) 100%)'
    );
    root.style.setProperty(
      '--lg-card-hover-bg',
      'linear-gradient(135deg, #ffffff 0%, rgba(248, 250, 252, 0.95) 100%)'
    );
    root.style.setProperty('--lg-card-border', borderHex || '#cbd5e1');
    root.style.setProperty('--lg-card-border-hover', borderHover);
    root.style.setProperty('--lg-card-shadow', '0 14px 32px -8px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)');
    root.style.setProperty('--lg-card-bevel', 'inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--lg-pill-bg', 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 245, 249, 0.85) 100%)');
    root.style.setProperty('--lg-pill-border', borderHex || '#cbd5e1');
    root.style.setProperty('--lg-pill-text', '#0f172a');
    root.style.setProperty('--lg-header-bg', headerGradient || `linear-gradient(180deg, ${bgHex}f5 0%, ${bgHex}e6 100%)`);
    root.style.setProperty('--lg-header-border', borderHex || '#cbd5e1');
  }
}
