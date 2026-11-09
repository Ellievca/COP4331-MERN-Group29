import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getCards, getCourses, getDeck } from '../api';
import { colors, tintFor } from '../styles/theme';
import { common } from '../styles/common';
import { filterCards, plural } from '../utils/format';
import SearchField from '../components/SearchField';
import FlashcardRow from '../components/FlashcardRow';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import CardSheet from '../components/CardSheet';
import DeleteCardSheet from '../components/DeleteCardSheet';
import CreateDeckSheet from '../components/CreateDeckSheet';

// One deck: its details and flashcards. Opened with { deckId, title }.
export default function DeckScreen({ navigation, route }) {
  const { deckId } = route.params;
  const [data, setData] = useState(null); // { deck, cards, courses }
  const [missing, setMissing] = useState(false); // deck was deleted / doesn't exist
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  // Pop-ups
  const [cardSheet, setCardSheet] = useState(null); // null, { card: null } to add, { card } to edit
  const [deletingCard, setDeletingCard] = useState(null);
  const [editingDeck, setEditingDeck] = useState(false);

  const load = useCallback(async () => {
    try {
      const [deck, cards, courses] = await Promise.all([
        getDeck(deckId),
        getCards(deckId),
        getCourses(),
      ]);
      setData({ deck, cards, courses });
      setMissing(false);
      setError('');
    } catch (e) {
      if (e.status === 404) setMissing(true);
      else if (e.status !== 401) setError(e.message);
    }
  }, [deckId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // "Edit" in the top bar, once the deck has loaded.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: data
        ? () => (
            <Pressable
              style={common.headerActionButton}
              onPress={() => setEditingDeck(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Edit deck details"
            >
              <Text style={common.headerAction}>Edit</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, data]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const visible = useMemo(() => (data ? filterCards(data.cards, query) : []), [data, query]);

  if (missing) {
    return (
      <View style={common.messagePage}>
        <EmptyState
          icon="help-circle-outline"
          title="This deck isn’t here."
          text="It may have been deleted. There’s always something else to learn."
        >
          <PrimaryButton title="Back to my decks" onPress={() => navigation.navigate('Decks')} />
        </EmptyState>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={common.messagePage}>
        <ErrorBanner message={error} />
        {error ? (
          <SecondaryButton title="Try again" onPress={handleRefresh} loading={refreshing} />
        ) : (
          <ActivityIndicator size="large" color={colors.purple} />
        )}
      </View>
    );
  }

  const { deck, cards, courses } = data;
  const course = courses.find((c) => c.id === deck.courseId);
  const tint = tintFor(course?.color);
  const openStudy = () => navigation.navigate('Study', { deckId: deck.id, title: deck.title });

  return (
    <>
      <ScrollView
        contentContainerStyle={common.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.purple} />
        }
      >
        {/* Deck details */}
        <View style={common.pageHeader}>
          <View style={common.pageHeaderText}>
            <Text style={[common.courseLabel, { color: tint.ink }]}>
              {course ? course.code || course.name : 'PERSONAL DECK'}
            </Text>
            <Text style={common.heading} accessibilityRole="header">
              {deck.title}
            </Text>
            <Text style={common.pageSubtitle}>
              {deck.description || 'Your own little collection of knowledge.'}
            </Text>
            <View style={common.metaRow}>
              <Ionicons name="layers-outline" size={15} color={colors.muted} />
              <Text style={common.metaText}>{plural(cards.length, 'flashcard')} · Private deck</Text>
            </View>
          </View>
        </View>

        <View style={common.buttonRow}>
          <SecondaryButton
            title="Add card"
            onPress={() => setCardSheet({ card: null })}
            style={common.buttonRowItem}
          />
          {cards.length ? (
            <PrimaryButton title="Study now" onPress={openStudy} style={common.buttonRowItem} />
          ) : null}
        </View>

        <ErrorBanner message={error} />

        {!cards.length ? (
          <EmptyState
            icon="layers-outline"
            title="The first card is the hardest part."
            text="Start with one question you want to remember. You can build from there."
          >
            <PrimaryButton
              title="Add your first flashcard"
              onPress={() => setCardSheet({ card: null })}
            />
          </EmptyState>
        ) : (
          <>
            <View style={common.toolbar}>
              <SearchField
                value={query}
                onChangeText={setQuery}
                placeholder="Search questions and answers…"
                label="Search flashcards"
              />
              <View style={common.toolbarRow}>
                <Text style={common.resultCount} accessibilityLiveRegion="polite">
                  {plural(visible.length, 'flashcard')}
                </Text>
                <Text style={common.resultCount}>Tap a card to edit</Text>
              </View>
            </View>

            {visible.length ? (
              <View style={common.list}>
                {visible.map((card) => (
                  <FlashcardRow
                    key={card.id}
                    card={card}
                    // Number cards by their place in the whole deck, even while searching.
                    index={cards.indexOf(card)}
                    onPress={() => setCardSheet({ card })}
                    onDelete={() => setDeletingCard(card)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="search-outline"
                title="No flashcards found."
                text="Try another word from a question or answer."
              >
                <SecondaryButton title="Clear search" onPress={() => setQuery('')} />
              </EmptyState>
            )}
          </>
        )}
      </ScrollView>

      <CardSheet
        visible={Boolean(cardSheet)}
        deck={deck}
        card={cardSheet?.card}
        onClose={() => setCardSheet(null)}
        onSaved={(saved) => {
          setData((d) => {
            const exists = d.cards.some((c) => c.id === saved.id);
            return {
              ...d,
              cards: exists
                ? d.cards.map((c) => (c.id === saved.id ? saved : c))
                : [...d.cards, saved],
            };
          });
          if (cardSheet?.card) setCardSheet(null); // editing closes; adding stays open
        }}
      />
      <DeleteCardSheet
        deckId={deck.id}
        card={deletingCard}
        onClose={() => setDeletingCard(null)}
        onDeleted={(card) => {
          setDeletingCard(null);
          setData((d) => ({ ...d, cards: d.cards.filter((c) => c.id !== card.id) }));
        }}
      />
      <CreateDeckSheet
        visible={editingDeck}
        deck={deck}
        courses={courses}
        onClose={() => setEditingDeck(false)}
        onCreated={(saved) => {
          setEditingDeck(false);
          setData((d) => ({ ...d, deck: saved }));
          navigation.setOptions({ title: saved.title });
        }}
      />
    </>
  );
}
