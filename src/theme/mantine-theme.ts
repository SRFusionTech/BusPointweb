import { createTheme, rem, type CSSVariablesResolver, type MantineColorsTuple } from '@mantine/core';
import { mantineColors, palettes, radius, typography } from './tokens.generated';

/**
 * Console theme — generated from design/tokens.json (via tokens.generated.ts / .css).
 * No color literals here: palettes are token tuples, surfaces/text map to --bp-* variables.
 */
const tuple = (k: keyof typeof mantineColors) => [...mantineColors[k]] as unknown as MantineColorsTuple;
const px = (n: number) => rem(n);
const w = typography.web;

export const mantineTheme = createTheme({
  primaryColor: 'teal',
  primaryShade: { light: 6, dark: 4 },
  colors: {
    teal: tuple('teal'),
    navy: tuple('navy'),
    gray: tuple('mist'),
    dark: tuple('dark'),
    brass: tuple('brass'),
    success: tuple('success'),
    warning: tuple('warning'),
    danger: tuple('danger'),
    info: tuple('info'),
    // Mantine internals use these names (Alert color="danger" etc.) — alias to semantic scales.
    red: tuple('danger'),
    green: tuple('success'),
    yellow: tuple('warning'),
    orange: tuple('warning'),
    blue: tuple('info'),
    brand: tuple('navy'),
  },
  // Real hex values (Mantine runs color math on these); surfaces themselves come from CSS vars below.
  white: palettes.light.bg.surface,
  black: palettes.light.text.primary,
  fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  headings: {
    fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: px(w['3xl'].size), lineHeight: String(w['3xl'].lineHeight / w['3xl'].size) },
      h2: { fontSize: px(w['2xl'].size), lineHeight: String(w['2xl'].lineHeight / w['2xl'].size) },
      h3: { fontSize: px(w.xl.size), lineHeight: String(w.xl.lineHeight / w.xl.size) },
      h4: { fontSize: px(w.lg.size), lineHeight: String(w.lg.lineHeight / w.lg.size) },
      h5: { fontSize: px(w.md.size), lineHeight: String(w.md.lineHeight / w.md.size) },
      h6: { fontSize: px(w.sm.size), lineHeight: String(w.sm.lineHeight / w.sm.size) },
    },
  },
  fontSizes: { xs: px(w.xs.size), sm: px(w.sm.size), md: px(w.md.size), lg: px(w.lg.size), xl: px(w.xl.size) },
  lineHeights: { xs: '1.4', sm: '1.45', md: '1.5', lg: '1.55', xl: '1.4' },
  radius: { xs: px(radius.xs), sm: px(radius.sm), md: px(radius.md), lg: px(radius.lg), xl: px(radius.xl) },
  defaultRadius: 'md',
  spacing: { xs: px(8), sm: px(12), md: px(16), lg: px(24), xl: px(32) },
  shadows: {
    xs: 'var(--bp-shadow-e1)',
    sm: 'var(--bp-shadow-e1)',
    md: 'var(--bp-shadow-e2)',
    lg: 'var(--bp-shadow-e2)',
    xl: 'var(--bp-shadow-e3)',
  },
  cursorType: 'pointer',
  focusRing: 'auto',
  autoContrast: true,
  luminanceThreshold: 0.35,
  other: {
    /** Display serif for page titles and empty states. */
    fontDisplay: 'var(--font-fraunces), ui-serif, Georgia, serif',
  },
  components: {
    Button: { defaultProps: { radius: 'md' }, styles: { root: { fontWeight: 600 } } },
    ActionIcon: { defaultProps: { variant: 'subtle', color: 'gray', radius: 'md' } },
    Card: { defaultProps: { withBorder: true, radius: 'lg', shadow: 'xs', padding: 'lg' } },
    Paper: { defaultProps: { radius: 'lg' } },
    Modal: { defaultProps: { radius: 'lg', centered: true, overlayProps: { backgroundOpacity: 0.48, blur: 4 }, transitionProps: { transition: 'pop', duration: 180 } } },
    Drawer: { defaultProps: { overlayProps: { backgroundOpacity: 0.48, blur: 4 } } },
    Menu: { defaultProps: { radius: 'md', shadow: 'md', withinPortal: true } },
    Popover: { defaultProps: { radius: 'md', shadow: 'md' } },
    Tooltip: { defaultProps: { withArrow: true, radius: 'sm' } },
    Badge: { defaultProps: { radius: 'xl', variant: 'light' }, styles: { root: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 } } },
    TextInput: { defaultProps: { radius: 'md' } },
    PasswordInput: { defaultProps: { radius: 'md' } },
    Select: { defaultProps: { radius: 'md', checkIconPosition: 'right' } },
    Table: { defaultProps: { verticalSpacing: 'sm', highlightOnHover: true } },
    Notification: { defaultProps: { radius: 'lg' } },
    SegmentedControl: { defaultProps: { radius: 'md' } },
    Tabs: { defaultProps: { color: 'teal' } },
  },
});

/** Shared with the marketing site's toggle so dark mode is one preference. */
export const COLOR_SCHEME_STORAGE_KEY = 'buspoint-theme';

/**
 * Surfaces & text map to the semantic --bp-* variables (tokens.generated.css), so the
 * console follows design/tokens.json exactly in both schemes.
 *   --app-chrome  sidebar + header background · --app-body  page background
 */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    '--app-chrome': 'var(--bp-bg-surface)',
    '--app-body': 'var(--bp-bg-canvas)',
    '--app-font-display': 'var(--font-fraunces), ui-serif, Georgia, serif',
  },
  light: {
    '--mantine-color-body': 'var(--bp-bg-canvas)',
    '--mantine-color-text': 'var(--bp-text-primary)',
    '--mantine-color-dimmed': 'var(--bp-text-muted)',
    '--mantine-color-default': 'var(--bp-bg-surface)',
    '--mantine-color-default-hover': 'var(--bp-bg-surface-alt)',
    '--mantine-color-default-color': 'var(--bp-text-primary)',
    '--mantine-color-default-border': 'var(--bp-border-default)',
    '--mantine-color-placeholder': 'var(--bp-text-muted)',
    '--mantine-color-anchor': 'var(--bp-text-link)',
    '--mantine-color-error': 'var(--bp-status-danger-text)',
  },
  dark: {
    '--mantine-color-body': 'var(--bp-bg-canvas)',
    '--mantine-color-text': 'var(--bp-text-primary)',
    '--mantine-color-dimmed': 'var(--bp-text-muted)',
    '--mantine-color-default': 'var(--bp-bg-surface)',
    '--mantine-color-default-hover': 'var(--bp-bg-elevated)',
    '--mantine-color-default-color': 'var(--bp-text-primary)',
    '--mantine-color-default-border': 'var(--bp-border-default)',
    '--mantine-color-placeholder': 'var(--bp-text-muted)',
    '--mantine-color-anchor': 'var(--bp-text-link)',
    '--mantine-color-error': 'var(--bp-status-danger-text)',
  },
});
