import { createTheme, type CSSVariablesResolver, type MantineColorsTuple } from '@mantine/core';

/** BusPoint brand blue — same values the landing page uses (Tailwind blue). */
const brand: MantineColorsTuple = [
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa',
  '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
];

export const mantineTheme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 5 },
  colors: { brand },
  fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  fontFamilyMonospace: 'var(--font-geist-mono), ui-monospace, monospace',
  headings: { fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif', fontWeight: '600' },
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Card: { defaultProps: { withBorder: true, radius: 'lg' } },
    Paper: { defaultProps: { radius: 'lg' } },
    Modal: { defaultProps: { radius: 'lg', centered: true, overlayProps: { backgroundOpacity: 0.45, blur: 3 } } },
    Menu: { defaultProps: { radius: 'md', shadow: 'md', withinPortal: true } },
    Tooltip: { defaultProps: { withArrow: true } },
    Badge: { defaultProps: { radius: 'sm' } },
  },
});

/** Shared with the landing page's own toggle so dark mode is one preference. */
export const COLOR_SCHEME_STORAGE_KEY = 'buspoint-theme';

/**
 * Console surface tokens:
 *   --app-chrome  sidebar + header background
 *   --app-body    page background behind the cards
 * Use as Mantine prop values, e.g. bg="var(--app-body)".
 */
export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {},
  light: {
    '--app-chrome': theme.white,
    '--app-body': theme.colors.gray[1],
  },
  dark: {
    '--app-chrome': theme.colors.dark[7],
    '--app-body': theme.colors.dark[8],
  },
});
