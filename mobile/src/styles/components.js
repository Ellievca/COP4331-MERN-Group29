// Styles for the reusable pieces in src/components/ (fields, buttons, cards, rows, ...).
// Kept here so every style in the app lives in src/styles/.
import { StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, radius, size, spacing } from './theme';

// Soft white card look shared by tiles, deck cards and rows on signed-in screens.
const panel = {
  backgroundColor: colors.white,
  borderRadius: radius.input,
  borderWidth: 1,
  borderColor: colors.border,
};

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
    paddingHorizontal: spacing.xl,
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
    paddingHorizontal: spacing.xl,
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

// "Let's study" banner on the home screen
export const heroStyles = StyleSheet.create({
  box: {
    backgroundColor: colors.heroFill,
    borderRadius: radius.logo,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  eyebrow: {
    fontSize: fontSize.eyebrow,
    letterSpacing: 1.5,
    color: colors.purple,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.title,
    lineHeight: 28,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  text: { fontSize: fontSize.body, color: colors.muted, marginTop: spacing.sm, lineHeight: 21 },
  upNext: { fontSize: fontSize.small, color: colors.muted, marginTop: spacing.md },
  upNextTitle: { color: colors.ink, fontWeight: fontWeight.semibold },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.purple,
    borderRadius: radius.button,
    paddingHorizontal: 18,
    height: 46,
    marginTop: spacing.lg,
  },
  buttonPressed: { backgroundColor: colors.purpleDark },
  buttonText: { color: colors.white, fontSize: fontSize.body, fontWeight: fontWeight.bold },
  // decorative rings in the corner
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.heroRing,
    right: -70,
    top: -60,
  },
  ringSmall: { width: 120, height: 120, right: -40, top: -30 },
});

// The three number tiles (My decks / Flashcards / This week)
export const statStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  tile: { ...panel, flex: 1, padding: spacing.md, gap: spacing.sm },
  icon: {
    width: size.icon,
    height: size.icon,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: fontSize.stat, fontWeight: fontWeight.bold, color: colors.ink },
  label: { fontSize: fontSize.caption, color: colors.muted },
});

// Daily goal card with the progress ring and the week strip
export const goalStyles = StyleSheet.create({
  card: { ...panel, borderRadius: radius.logo, padding: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: fontSize.input, fontWeight: fontWeight.bold, color: colors.ink },
  subtitle: { fontSize: fontSize.small, color: colors.muted, marginTop: 2 },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginTop: spacing.lg },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringValue: { fontSize: fontSize.title, fontWeight: fontWeight.bold, color: colors.ink },
  ringOf: { fontSize: fontSize.small, color: colors.muted, fontWeight: '400' },
  ringLabel: { fontSize: fontSize.tiny, color: colors.muted },
  message: { flex: 1, fontSize: fontSize.label, color: colors.ink, lineHeight: 20 },
  messageStar: { color: colors.purple },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  day: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  dayLabel: { fontSize: fontSize.tiny, color: colors.muted, fontWeight: fontWeight.semibold },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: { borderWidth: 1.5, borderColor: colors.purple },
  dayPracticed: { backgroundColor: colors.lavender },
  dayNumber: { fontSize: fontSize.caption, color: colors.muted },
  dayNumberToday: { color: colors.purple, fontWeight: fontWeight.bold },
});

// Deck card in a list
export const deckStyles = StyleSheet.create({
  card: { ...panel, padding: spacing.lg },
  pressed: { backgroundColor: colors.background },
  course: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  courseDot: { width: 8, height: 8, borderRadius: radius.pill },
  courseText: { fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  title: { fontSize: fontSize.input, fontWeight: fontWeight.bold, color: colors.ink },
  description: { fontSize: fontSize.small, color: colors.muted, marginTop: spacing.xxs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { fontSize: fontSize.caption, color: colors.muted },
});

// One past study session
export const sessionStyles = StyleSheet.create({
  row: {
    ...panel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  icon: {
    width: size.icon,
    height: size.icon,
    borderRadius: radius.tile,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: fontSize.label, fontWeight: fontWeight.bold, color: colors.ink },
  meta: { fontSize: fontSize.caption, color: colors.muted, marginTop: 2 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.successFill,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  pillText: { fontSize: fontSize.caption, color: colors.success, fontWeight: fontWeight.semibold },
});

// "Nothing here yet" box
export const emptyStyles = StyleSheet.create({
  box: {
    ...panel,
    borderStyle: 'dashed',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  title: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  text: { fontSize: fontSize.small, color: colors.muted, textAlign: 'center', lineHeight: 19 },
});
