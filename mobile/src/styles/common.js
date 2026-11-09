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
  // Spinner shown inside a scrolling page while data loads
  inlineLoading: { paddingVertical: 48, alignItems: 'center' },
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

  // ---- Signed-in page header: big greeting on the left, avatar on the right ----
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  pageHeaderText: { flex: 1 },
  spark: { color: colors.purple },
  pageSubtitle: { fontSize: fontSize.body, color: colors.muted, marginTop: spacing.xs },
  avatar: {
    width: size.avatar,
    height: size.avatar,
    borderRadius: radius.pill,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.purple, fontSize: fontSize.label, fontWeight: fontWeight.bold },

  // ---- Section heading with an optional "View all" link ----
  section: { marginTop: spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.section, fontWeight: fontWeight.bold, color: colors.ink },
  sectionSubtitle: { fontSize: fontSize.label, color: colors.muted, marginTop: 2 },
  textLink: { color: colors.purple, fontSize: fontSize.label, fontWeight: fontWeight.bold },

  // Space between stacked cards/rows in a list
  list: { gap: spacing.md },

  // Two buttons side by side (e.g. "New course" + "Create deck")
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  buttonRowItem: { flex: 1, height: size.buttonHeight, marginTop: 0 },

  // Search + sort + filters area at the top of a list page
  toolbar: { gap: spacing.md, marginBottom: spacing.lg },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { fontSize: fontSize.small, color: colors.muted },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  sortText: { fontSize: fontSize.small, color: colors.purple, fontWeight: fontWeight.semibold },

  // Simple centered message page (placeholders, account)
  messagePage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  messageText: {
    fontSize: fontSize.body,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
  },

  // Label/value lines on the account page
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: { fontSize: fontSize.label, color: colors.muted },
  infoValue: { fontSize: fontSize.label, color: colors.ink, fontWeight: fontWeight.semibold, flexShrink: 1 },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  avatarLargeText: { color: colors.purple, fontSize: fontSize.title, fontWeight: fontWeight.bold },
  centerText: { textAlign: 'center' },

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
