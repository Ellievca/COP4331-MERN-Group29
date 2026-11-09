import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCards, getCourses, getDeck, saveStudySession } from '../api';
import { colors, tintFor } from '../styles/theme';
import { common } from '../styles/common';
import { studyStyles as styles } from '../styles/components';
import { recallPercent } from '../utils/format';
import { newSessionId } from '../utils/ids';
import FlipCard from '../components/FlipCard';
import StatTile from '../components/StatTile';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import Notice from '../components/Notice';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

// A fresh session: first card, question side up, a new ID and start time.
function freshSession() {
  return {
    index: 0,
    flipped: false,
    correct: 0,
    startedAt: new Date().toISOString(),
    clientSessionId: newSessionId(),
  };
}

// Study one deck: flip each card, mark it "Got it" or "Needs practice",
// and the session is saved to your history after the last card. Opened with { deckId, title }.
export default function StudyScreen({ navigation, route }) {
  const { deckId } = route.params;
  const [data, setData] = useState(null); // { deck, cards, courses }
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [session, setSession] = useState(freshSession);
  const [pending, setPending] = useState(null); // finished session waiting to be saved (for retries)
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [done, setDone] = useState(null); // the saved session, shows the finish screen
  const cardRef = useRef(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [deck, cards, courses] = await Promise.all([
        getDeck(deckId),
        getCards(deckId),
        getCourses(),
      ]);
      setData({ deck, cards, courses });
    } catch (e) {
      if (e.status === 404) setMissing(true);
      else if (e.status !== 401) setLoadError(e.message);
    }
  }, [deckId]);

  useEffect(() => {
    load();
  }, [load]);

  // Sends the finished session. Retrying sends the exact same session (same ID),
  // so the server never records it twice.
  async function save(finished) {
    setSaving(true);
    setSaveError('');
    try {
      await saveStudySession({ deck: data.deck, ...finished });
      setPending(null);
      setDone(finished);
    } catch (e) {
      if (e.status !== 401) setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function grade(knewIt) {
    if (saving || pending) return;
    const correct = session.correct + (knewIt ? 1 : 0);
    if (session.index < data.cards.length - 1) {
      setSession((s) => ({ ...s, index: s.index + 1, flipped: false, correct }));
      return;
    }
    // That was the last card: save the session.
    const finished = {
      clientSessionId: session.clientSessionId,
      startedAt: session.startedAt,
      endedAt: new Date().toISOString(),
      cardsReviewed: data.cards.length,
      cardsCorrect: correct,
    };
    setSession((s) => ({ ...s, correct }));
    setPending(finished);
    save(finished);
  }

  function studyAgain() {
    setSession(freshSession());
    setPending(null);
    setDone(null);
    setSaveError('');
  }

  // ---------- Loading, missing, and empty states ----------

  if (missing) {
    return (
      <View style={common.messagePage}>
        <EmptyState
          icon="help-circle-outline"
          title="This deck isn’t here."
          text="Try another deck to start a study session."
        >
          <PrimaryButton title="Choose a deck" onPress={() => navigation.navigate('Decks')} />
        </EmptyState>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={common.messagePage}>
        <ErrorBanner message={loadError} />
        {loadError ? (
          <SecondaryButton title="Try again" onPress={load} />
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.purple} />
            <Text style={common.messageText}>Making a little room for focus…</Text>
          </>
        )}
      </View>
    );
  }

  const { deck, cards, courses } = data;

  if (!cards.length) {
    return (
      <View style={common.messagePage}>
        <EmptyState
          icon="layers-outline"
          title="A little empty at the moment."
          text="Add a few cards to this deck, then come back to study."
        >
          <PrimaryButton title="Add flashcards" onPress={() => navigation.goBack()} />
        </EmptyState>
      </View>
    );
  }

  // ---------- Finish screen ----------

  if (done) {
    return (
      <ScrollView contentContainerStyle={common.scroll}>
        <View style={styles.complete}>
          <View style={styles.art}>
            <Ionicons name="sparkles" size={42} color={colors.purple} />
          </View>
          <Text style={styles.completeEyebrow}>A LITTLE MORE CONFIDENT</Text>
          <Text style={[common.heading, common.centerText]} accessibilityRole="header">
            Look at you grow.
          </Text>
          <Text style={styles.completeText}>
            You made time for a little learning.{'\n'}That’s something worth feeling good about.
          </Text>

          <View style={styles.stats}>
            <StatTile icon="layers-outline" value={done.cardsReviewed} label="Reviewed" />
            <StatTile icon="checkmark-circle-outline" value={done.cardsCorrect} label="Recalled" tint="blue" />
            <StatTile
              icon="locate-outline"
              value={`${recallPercent(done.cardsCorrect, done.cardsReviewed)}%`}
              label="Recall rate"
              tint="peach"
            />
          </View>

          <View style={styles.stretch}>
            <Notice message="Session saved to your study history." />
          </View>

          <View style={styles.buttons}>
            <PrimaryButton title="Study again" onPress={studyAgain} />
            <SecondaryButton title="Back to deck" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </ScrollView>
    );
  }

  // ---------- Studying ----------

  const course = courses.find((c) => c.id === deck.courseId);
  const card = cards[session.index];
  const busy = saving || Boolean(pending);

  return (
    <ScrollView contentContainerStyle={common.scroll}>
      <Text style={[common.courseLabel, { color: tintFor(course?.color).ink }]}>
        {course ? course.code || course.name : 'PERSONAL DECK'}
      </Text>
      <Text style={common.heading} accessibilityRole="header">
        {deck.title}
      </Text>
      <Text style={common.pageSubtitle}>One question. A little curiosity. You’ve got this.</Text>

      <View style={styles.progressLabel}>
        <Text style={styles.progressEyebrow}>YOUR FOCUS SESSION</Text>
        <Text style={styles.progressCount}>
          {session.index + 1}
          <Text style={styles.progressOf}> / {cards.length} cards</Text>
        </Text>
      </View>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityLabel="Session progress"
        accessibilityValue={{ min: 0, max: cards.length, now: session.index }}
      >
        <View style={[styles.fill, { width: `${(session.index / cards.length) * 100}%` }]} />
      </View>

      <FlipCard
        ref={cardRef}
        // A new key per card resets the flip animation when moving on.
        key={card.id}
        card={card}
        flipped={session.flipped}
        onFlip={() => setSession((s) => ({ ...s, flipped: !s.flipped }))}
        disabled={busy}
      />

      <View style={styles.controls}>
        {saveError ? (
          <>
            <ErrorBanner message={`Your session didn’t save yet. ${saveError}`} />
            <PrimaryButton title="Try saving again" onPress={() => save(pending)} loading={saving} />
          </>
        ) : busy ? (
          <PrimaryButton title="Saving session…" loading />
        ) : session.flipped ? (
          <>
            <Text style={styles.prompt}>How did that one feel?</Text>
            <View style={common.buttonRow}>
              <SecondaryButton
                title="Needs practice"
                onPress={() => grade(false)}
                style={common.buttonRowItem}
              />
              <PrimaryButton title="Got it" onPress={() => grade(true)} style={common.buttonRowItem} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.prompt}>No rush. Give yourself a moment to remember.</Text>
            <PrimaryButton title="Show answer" onPress={() => cardRef.current?.flip()} />
          </>
        )}
      </View>

      <Text style={styles.note}>✦ A little focus goes a long way. ✦</Text>
    </ScrollView>
  );
}
