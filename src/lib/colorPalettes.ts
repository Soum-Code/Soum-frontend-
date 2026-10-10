import {
  ColorPalette,
  ChalkSurfacePreset,
  DarkSurfacePreset,
  ButterSurfacePreset,
  SurfacePresetConfig,
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
    if (presetId === 'custom' && customColor) {
      bgHex = customColor;
      cardHex = '#ffffff';
      borderHex = 'rgba(15, 23, 42, 0.14)';
      accentHex = '#0284c7';
      glowHex = 'rgba(2, 132, 199, 0.20)';
      cardGradient = `linear-gradient(135deg, #ffffff 0%, ${customColor} 100%)`;
      headerGradient = `linear-gradient(180deg, rgba(255,255,255,0.92) 0%, ${customColor}e6 100%)`;
    } else {
      const preset = CHALK_PRESETS.find((p) => p.id === presetId) || CHALK_PRESETS[0];
      bgHex = preset.bgHex;
      cardHex = preset.cardHex;
      borderHex = preset.borderHex;
      accentHex = preset.accentHex;
      glowHex = `${preset.accentHex}33`;
      cardGradient = `linear-gradient(135deg, #ffffff 0%, ${preset.bgHex} 100%)`;
      headerGradient = `linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, ${preset.bgHex}ea 100%)`;
    }
    textPrimary = '#0f172a';
    textSecondary = '#334155';
    textMuted = '#64748b';

    root.style.setProperty('--chalk-surface-bg', bgHex);
    root.style.setProperty('--chalk-header-bg', `${bgHex}f0`);
    root.style.setProperty('--chalk-card-bg', cardHex);
    root.style.setProperty('--chalk-border', borderHex);
    root.style.setProperty('--chalk-accent', accentHex);
    root.style.setProperty('--chalk-card-gradient', cardGradient);
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
    root.style.setProperty(
      '--lg-card-bg',
      cardGradient || 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 250, 252, 0.62) 40%, rgba(241, 245, 249, 0.76) 100%)'
    );
    root.style.setProperty(
      '--lg-card-hover-bg',
      'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.75) 40%, rgba(241, 245, 249, 0.85) 100%)'
    );
    root.style.setProperty('--lg-card-border', borderHex || 'rgba(203, 213, 225, 0.85)');
    root.style.setProperty('--lg-card-border-hover', 'rgba(148, 163, 184, 0.6)');
    root.style.setProperty('--lg-card-shadow', '0 16px 36px -8px rgba(15, 23, 42, 0.07), 0 4px 14px -3px rgba(15, 23, 42, 0.04)');
    root.style.setProperty('--lg-card-bevel', 'inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--lg-pill-bg', 'linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(241, 245, 249, 0.75) 100%)');
    root.style.setProperty('--lg-pill-border', 'rgba(203, 213, 225, 0.8)');
    root.style.setProperty('--lg-pill-text', '#0f172a');
    root.style.setProperty('--lg-header-bg', headerGradient || `linear-gradient(180deg, ${bgHex}f0 0%, ${bgHex}d8 100%)`);
    root.style.setProperty('--lg-header-border', 'rgba(203, 213, 225, 0.8)');
  }
}
