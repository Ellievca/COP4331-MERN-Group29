import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getDecks, getStudySessions } from '../api';
import { colors } from '../styles/theme';
import { common } from '../styles/common';
import { statStyles } from '../styles/components';
import { historySummary } from '../utils/format';
import StatTile from '../components/StatTile';
import SectionHeader from '../components/SectionHeader';
import SessionRow from '../components/SessionRow';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

export default function HistoryScreen({ navigation }) {
  const [data, setData] = useState(null); // { decks, sessions }
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [decks, sessions] = await Promise.all([getDecks(), getStudySessions()]);
      setData({ decks, sessions });
      setError('');
    } catch (e) {
      if (e.status !== 401) setError(e.message);
    }
  }, []);

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

  const summary = data ? historySummary(data.sessions) : null;
  // Use the deck's current name if it still exists, otherwise the name saved with the session.
  const titleOf = (session) => data?.decks.find((d) => d.id === session.deckId)?.title;

  return (
    <SafeAreaView style={common.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={common.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.purple} />
        }
      >
        <View style={common.pageHeader}>
          <View style={common.pageHeaderText}>
            <Text style={common.eyebrow}>LOOK HOW FAR YOU’VE COME</Text>
            <Text style={common.heading} accessibilityRole="header">
              Little sessions. Real progress.
            </Text>
            <Text style={common.pageSubtitle}>A record of the time you made for learning.</Text>
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
            <View style={statStyles.row}>
              <StatTile icon="time-outline" value={summary.sessionCount} label="Sessions" />
              <StatTile
                icon="layers-outline"
                value={summary.reviewed}
                label="Reviewed"
                tint="blue"
              />
              <StatTile
                icon="locate-outline"
                value={summary.recallRate}
                label="Recall rate"
                tint="peach"
              />
            </View>

            <View style={common.section}>
              <SectionHeader title="Your study history" subtitle="Small steps worth remembering." />
              {summary.sessions.length ? (
                <View style={common.list}>
                  {summary.sessions.map((session) => (
                    <SessionRow key={session.id} session={session} deckTitle={titleOf(session)} />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon="time-outline"
                  title="Your first session is waiting."
                  text="Pick a deck and study for a few minutes. It’ll show up here."
                >
                  <PrimaryButton
                    title="Choose a deck"
                    onPress={() => navigation.navigate('Decks')}
                  />
                </EmptyState>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
