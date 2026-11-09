import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCourses, getDecks, getStudySessions, logout } from '../api';
import { colors } from '../styles/theme';
import { common } from '../styles/common';
import { statStyles } from '../styles/components';
import { homeSummary, initials } from '../utils/format';
import StudyHero from '../components/StudyHero';
import StatTile from '../components/StatTile';
import DailyGoal from '../components/DailyGoal';
import SectionHeader from '../components/SectionHeader';
import DeckCard from '../components/DeckCard';
import SessionRow from '../components/SessionRow';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

// Props:
//   user            – the signed-in user
//   onLoggedOut()   – called after signing out
//   onOpenDeck(deck), onStudyDeck(deck), onSeeAllDecks(), onSeeHistory(), onCreateDeck()
//                   – where the buttons go (wired up as the other screens get built)
export default function HomeScreen({
  user,
  onLoggedOut,
  onOpenDeck,
  onStudyDeck,
  onSeeAllDecks,
  onSeeHistory,
  onCreateDeck,
}) {
  const [data, setData] = useState(null); // { courses, decks, sessions }
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Load everything the home screen needs at once.
  const load = useCallback(async () => {
    try {
      const [courses, decks, sessions] = await Promise.all([
        getCourses(),
        getDecks(),
        getStudySessions(),
      ]);
      setData({ courses, decks, sessions });
      setError('');
    } catch (e) {
      if (e.status !== 401) setError(e.message); // 401 already sends you to login
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
    } catch {
      // Even if the server call fails, sign out on this phone.
    }
    onLoggedOut();
  }

  const summary = data ? homeSummary(data) : null;
  const courseOf = (deck) => data?.courses.find((c) => c.id === deck.courseId);
  const titleOf = (session) => data?.decks.find((d) => d.id === session.deckId)?.title;

  return (
    <SafeAreaView style={common.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={common.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.purple} />
        }
      >
        {/* Greeting */}
        <View style={common.pageHeader}>
          <View style={common.pageHeaderText}>
            <Text style={common.eyebrow}>A FRESH PAGE, EVERY DAY</Text>
            <Text style={common.heading} accessibilityRole="header">
              Let’s get in sync, {user.firstName}
              <Text style={common.spark}> ✦</Text>
            </Text>
            <Text style={common.pageSubtitle}>
              A little focus today. A little more confidence tomorrow.
            </Text>
          </View>
          <View style={common.avatar} accessibilityLabel={`Signed in as ${user.firstName}`}>
            <Text style={common.avatarText}>{initials(user)}</Text>
          </View>
        </View>

        <ErrorBanner message={error} />

        {!summary ? (
          error ? (
            <SecondaryButton title="Try again" onPress={handleRefresh} loading={refreshing} />
          ) : (
            <View style={common.inlineLoading}>
              <ActivityIndicator size="large" color={colors.purple} />
            </View>
          )
        ) : (
          <>
            <StudyHero
              deck={summary.recommended}
              onPress={() =>
                summary.recommended ? onStudyDeck(summary.recommended) : onSeeAllDecks()
              }
            />

            <View style={statStyles.row}>
              <StatTile icon="book-outline" value={summary.deckCount} label="My decks" />
              <StatTile
                icon="layers-outline"
                value={summary.totalCards}
                label="Flashcards"
                tint="blue"
              />
              <StatTile
                icon="trending-up-outline"
                value={summary.weekReviewed}
                label="This week"
                tint="peach"
              />
            </View>

            <View style={common.section}>
              <DailyGoal summary={summary} />
            </View>

            <View style={common.section}>
              <SectionHeader
                title="Pick up a little knowledge"
                subtitle="Your decks, ready when you are."
                linkText={summary.deckCount ? 'View all' : null}
                onLinkPress={onSeeAllDecks}
              />
              {summary.recentDecks.length ? (
                <View style={common.list}>
                  {summary.recentDecks.map((deck) => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      course={courseOf(deck)}
                      onPress={() => onOpenDeck(deck)}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon="book-outline"
                  title="A fresh start for your ideas."
                  text="Start with one topic. Add a few cards. See where it takes you."
                >
                  <PrimaryButton title="Create your first deck" onPress={onCreateDeck} />
                </EmptyState>
              )}
            </View>

            <View style={common.section}>
              <SectionHeader
                title="A little progress lately"
                subtitle="Every study session counts."
                linkText={data.sessions.length ? 'History' : null}
                onLinkPress={onSeeHistory}
              />
              {summary.recentSessions.length ? (
                <View style={common.list}>
                  {summary.recentSessions.map((session) => (
                    <SessionRow key={session.id} session={session} deckTitle={titleOf(session)} />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon="time-outline"
                  title="Your first session is waiting."
                  text="Review a deck and your progress will show up here."
                />
              )}
            </View>
          </>
        )}

        <View style={common.section}>
          <SecondaryButton title="Sign out" onPress={handleLogout} loading={signingOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
