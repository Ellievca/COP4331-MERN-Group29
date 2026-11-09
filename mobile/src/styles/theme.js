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
};

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
  input: 12,
  button: 14,
  logo: 16,
  card: 20,
};

export const fontSize = {
  eyebrow: 11, // small all-caps labels
  small: 13, // field hints and errors
  label: 14,
  body: 15,
  input: 16,
  title: 22, // card titles
  heading: 28, // big page headings
};

export const fontWeight = {
  semibold: '600',
  bold: '700',
};

export const size = {
  inputHeight: 50,
  buttonHeight: 52,
  logo: 56,
};
