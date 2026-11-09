// Shared screen styles: the closest thing React Native has to a global stylesheet.
// Every screen imports `common` and uses these, so layouts, cards and text all match.
// Only theme.js values are used here — no raw colors or numbers.
import { StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, radius, size, spacing } from './theme';

export const common = StyleSheet.create({
  // ---- Page layout ----
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.xl },
  scrollCentered: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },

  // ---- White rounded card ----
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  // ---- Text ----
  eyebrow: {
    fontSize: fontSize.eyebrow,
    letterSpacing: 2,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  heading: { fontSize: fontSize.heading, fontWeight: fontWeight.bold, color: colors.ink },
  headingSubtitle: {
    fontSize: fontSize.body,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.bold, color: colors.ink },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.muted,
    marginTop: spacing.xxs,
    marginBottom: 20,
  },
  link: { color: colors.purple, fontSize: fontSize.body, fontWeight: fontWeight.bold },

  // ---- "Already have an account? Sign in" line under a card ----
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { color: colors.muted, fontSize: fontSize.body },

  // ---- "< Sign in" back link at the top of a page ----
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  backText: { color: colors.purple, fontSize: fontSize.input, fontWeight: fontWeight.semibold },

  // ---- StudySync logo block ----
  brand: { alignItems: 'center', marginBottom: 28 },
  logo: {
    width: size.logo,
    height: size.logo,
    borderRadius: radius.logo,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandName: { fontSize: fontSize.heading, fontWeight: fontWeight.bold, color: colors.ink },
  tagline: {
    fontSize: fontSize.eyebrow,
    letterSpacing: 2,
    color: colors.muted,
    marginTop: spacing.xxs,
  },
});
