// Design tokens: the ONE place colors, spacing, corner rounding and text sizes are defined.
// Change a value here and every screen updates together.
// Colors are copied from the web app's frontend/src/styles.css so both apps match.

export const colors = {
  purple: '#7853cf',
  purpleDark: '#6541ba',
  ink: '#302a40', // main text
  muted: '#827b91', // secondary text
  border: '#ece8f1',
  lavender: '#f1ebfc', // light purple fill
  background: '#faf9fc',
  white: '#ffffff',
  error: '#b3261e',
  errorFill: '#fdecea',
  shadow: '#3a2456',
  heroFill: '#eee6fa', // "Let's study" banner
  heroRing: '#e0cef1',
  divider: '#f1edf5',
  success: '#627c51', // "10 / 12 recalled" pill
  successFill: '#edf4eb',
  successBorder: '#e5eedd',
  ringTrack: '#efebf8', // daily goal ring
  ring: '#8664d9',
  backdrop: 'rgba(48, 42, 64, 0.35)', // dims the screen behind pop-up sheets
};

// Course colors: the server stores 'purple', 'blue', 'peach' (or a custom hex).
// `fill` = soft background, `ink` = icon/label color, `dot` = small course dot.
export const tints = {
  purple: { fill: '#f0e9fb', ink: '#a081c7', dot: '#c5acde' },
  blue: { fill: '#edf1fb', ink: '#8d9dc8', dot: '#b4c4e7' },
  peach: { fill: '#fbefe8', ink: '#c8a08b', dot: '#e6c5b0' },
};

export function tintFor(color) {
  if (tints[color]) return tints[color];
  if (/^#[0-9a-f]{6}$/i.test(color || '')) return { fill: `${color}22`, ink: color, dot: color };
  return tints.purple;
}

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  pill: 999,
  small: 8,
  tile: 11,
  input: 12,
  button: 14,
  logo: 16,
  card: 20,
};

export const fontSize = {
  tiny: 10,
  eyebrow: 11, // small all-caps labels
  caption: 12,
  small: 13, // field hints and errors
  label: 14,
  body: 15,
  input: 16,
  section: 18, // section headings
  stat: 20, // numbers in stat tiles
  title: 22, // card titles
  heading: 28, // big page headings
};

export const fontWeight = {
  semibold: '600',
  bold: '700',
};

export const size = {
  avatar: 40,
  icon: 36, // round/square icon badges
  inputHeight: 50,
  buttonHeight: 52,
  logo: 56,
};
