// Styles for the reusable pieces in src/components/ (text fields, buttons, error box).
// Kept here so every style in the app lives in src/styles/.
import { StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, radius, size, spacing } from './theme';

export const fieldStyles = StyleSheet.create({
  field: { marginBottom: spacing.lg },
  label: {
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  inputWrap: { justifyContent: 'center' },
  input: {
    height: size.inputHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    fontSize: fontSize.input,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  inputWithEye: { paddingRight: 48 },
  inputError: { borderColor: colors.error },
  eye: { position: 'absolute', right: 14 },
  error: { color: colors.error, fontSize: fontSize.small, marginTop: spacing.xs },
  hint: { color: colors.muted, fontSize: fontSize.small, marginTop: spacing.xs },
});

export const buttonStyles = StyleSheet.create({
  // Big purple button
  primary: {
    height: size.buttonHeight,
    borderRadius: radius.button,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxs,
  },
  primaryPressed: { backgroundColor: colors.purpleDark },
  primaryText: { color: colors.white, fontSize: fontSize.input, fontWeight: fontWeight.bold },

  // Light lavender button (e.g. Sign out)
  secondary: {
    height: size.inputHeight,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPressed: { opacity: 0.8 },
  secondaryText: { color: colors.purple, fontSize: fontSize.input, fontWeight: fontWeight.bold },

  disabled: { opacity: 0.7 },
});

export const bannerStyles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.errorFill,
    borderRadius: radius.input,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  text: { flex: 1, color: colors.error, fontSize: fontSize.label, lineHeight: 20 },
});
