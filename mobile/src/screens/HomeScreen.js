import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getCourses, getDecks, getStudySessions } from '../api';
import { useAuth } from '../state/AuthContext';
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

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData] = useState(null); // { courses, decks, sessions }
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  // Reload every time this tab comes into view, so new decks/sessions show up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const openDeck = (deck) => navigation.navigate('Deck', { deckId: deck.id, title: deck.title });
  const studyDeck = (deck) => navigation.navigate('Study', { deckId: deck.id, title: deck.title });

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
          <Pressable
            style={common.avatar}
            onPress={() => navigation.navigate('Account')}
            accessibilityRole="button"
            accessibilityLabel="Your account"
            hitSlop={6}
          >
            <Text style={common.avatarText}>{initials(user)}</Text>
          </Pressable>
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
                summary.recommended ? studyDeck(summary.recommended) : navigation.navigate('Decks')
              }
            />

            <View style={statStyles.row}>
              <StatTile icon="book-outline" 
                value={summary.deckCount} 
                label="Total decks" 
              />
              <StatTile
                icon="layers-outline"
                value={summary.totalCards}
                label="Flashcards"
                tint="blue"
              />
              <StatTile
                icon="trending-up-outline"
                value={summary.weekReviewed}
                label="Reviewed"
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
                onLinkPress={() => navigation.navigate('Decks')}
              />
              {summary.recentDecks.length ? (
                <View style={common.list}>
                  {summary.recentDecks.map((deck) => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      course={courseOf(deck)}
                      onPress={() => openDeck(deck)}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon="book-outline"
                  title="A fresh start for your ideas."
                  text="Start with one topic. Add a few cards. See where it takes you."
                >
                  <PrimaryButton
                    title="Create your first deck"
                    onPress={() => navigation.navigate('Decks', { create: Date.now() })}
                  />
                </EmptyState>
              )}
            </View>

            <View style={common.section}>
              <SectionHeader
                title="A little progress lately"
                subtitle="Every study session counts."
                linkText={data.sessions.length ? 'History' : null}
                onLinkPress={() => navigation.navigate('History')}
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
      </ScrollView>
    </SafeAreaView>
  );
}
