import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getCourses, getDecks } from '../api';
import { colors, tintFor } from '../styles/theme';
import { common } from '../styles/common';
import { chipStyles } from '../styles/components';
import { SORT_OPTIONS, deckCountsByCourse, filterDecks, plural } from '../utils/format';
import SearchField from '../components/SearchField';
import Chip from '../components/Chip';
import DeckCard from '../components/DeckCard';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import CreateDeckSheet from '../components/CreateDeckSheet';
import CreateCourseSheet from '../components/CreateCourseSheet';
import DeleteDeckSheet from '../components/DeleteDeckSheet';

export default function DecksScreen({ navigation, route }) {
  const [data, setData] = useState(null); // { courses, decks }
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Search / filter / sort
  const [query, setQuery] = useState('');
  const [courseId, setCourseId] = useState('all');
  const [sort, setSort] = useState('recent');

  // Pop-ups
  const [creatingDeck, setCreatingDeck] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [deleting, setDeleting] = useState(null); // the deck being deleted

  const load = useCallback(async () => {
    try {
      const [courses, decks] = await Promise.all([getCourses(), getDecks()]);
      setData({ courses, decks });
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

  // Home's "Create your first deck" opens this tab with the create form showing.
  useEffect(() => {
    if (route.params?.create) {
      setCreatingDeck(true);
      navigation.setParams({ create: undefined });
    }
  }, [route.params?.create, navigation]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function cycleSort() {
    const index = SORT_OPTIONS.findIndex((option) => option.key === sort);
    setSort(SORT_OPTIONS[(index + 1) % SORT_OPTIONS.length].key);
  }

  function clearFilters() {
    setQuery('');
    setCourseId('all');
  }

  const visible = useMemo(
    () => (data ? filterDecks(data.decks, { query, courseId, sort }) : []),
    [data, query, courseId, sort],
  );
  const counts = useMemo(() => deckCountsByCourse(data?.decks || []), [data]);
  const courseOf = (deck) => data?.courses.find((c) => c.id === deck.courseId);
  const filtered = Boolean(query.trim()) || courseId !== 'all';
  const sortLabel = SORT_OPTIONS.find((option) => option.key === sort).label;

  return (
    <SafeAreaView style={common.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={common.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.purple} />
        }
      >
        <View style={common.pageHeader}>
          <View style={common.pageHeaderText}>
            <Text style={common.eyebrow}>KNOWLEDGE, NICELY ORGANIZED</Text>
            <Text style={common.heading} accessibilityRole="header">
              A home for every aha.
            </Text>
            <Text style={common.pageSubtitle}>
              Your courses and curiosities, one deck at a time.
            </Text>
          </View>
        </View>

        <View style={common.buttonRow}>
          <SecondaryButton
            title="New course"
            onPress={() => setCreatingCourse(true)}
            style={common.buttonRowItem}
          />
          <PrimaryButton
            title="Create deck"
            onPress={() => setCreatingDeck(true)}
            style={common.buttonRowItem}
          />
        </View>

        <ErrorBanner message={error} />

        {!data ? (
          error ? (
            <SecondaryButton title="Try again" onPress={handleRefresh} loading={refreshing} />
          ) : (
            <View style={common.inlineLoading}>
              <ActivityIndicator size="large" color={colors.purple} />
            </View>
          )
        ) : (
          <>
            <View style={common.toolbar}>
              <SearchField
                value={query}
                onChangeText={setQuery}
                placeholder="Find a deck, find your focus…"
                label="Search decks"
              />

              {data.courses.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={chipStyles.row}
                >
                  <Chip
                    label="All decks"
                    count={data.decks.length}
                    selected={courseId === 'all'}
                    onPress={() => setCourseId('all')}
                  />
                  {data.courses.map((course) => (
                    <Chip
                      key={course.id}
                      label={course.code || course.name}
                      count={counts[course.id] || 0}
                      dotColor={tintFor(course.color).dot}
                      selected={courseId === course.id}
                      onPress={() => setCourseId(course.id)}
                    />
                  ))}
                </ScrollView>
              ) : null}

              <View style={common.toolbarRow}>
                <Text style={common.resultCount} accessibilityLiveRegion="polite">
                  {plural(visible.length, 'deck')}
                </Text>
                <Pressable
                  style={common.sortButton}
                  onPress={cycleSort}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Sorted by ${sortLabel}. Tap to change.`}
                >
                  <Ionicons name="swap-vertical" size={15} color={colors.purple} />
                  <Text style={common.sortText}>{sortLabel}</Text>
                </Pressable>
              </View>
            </View>

            {visible.length ? (
              <View style={common.list}>
                {visible.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    course={courseOf(deck)}
                    onPress={() =>
                      navigation.navigate('Deck', { deckId: deck.id, title: deck.title })
                    }
                    onDelete={() => setDeleting(deck)}
                  />
                ))}
              </View>
            ) : filtered ? (
              <EmptyState
                icon="search-outline"
                title="No decks found. A fresh search?"
                text="Try a different title or description, or choose another course."
              >
                <SecondaryButton title="Clear filters" onPress={clearFilters} />
              </EmptyState>
            ) : (
              <EmptyState
                icon="book-outline"
                title="Your ideas belong here."
                text="Create a deck and add your first flashcard to get started."
              >
                <PrimaryButton title="Create your first deck" onPress={() => setCreatingDeck(true)} />
              </EmptyState>
            )}
          </>
        )}
      </ScrollView>

      <CreateDeckSheet
        visible={creatingDeck}
        courses={data?.courses || []}
        defaultCourseId={courseId === 'all' ? null : courseId}
        onClose={() => setCreatingDeck(false)}
        onCreated={(deck) => {
          setCreatingDeck(false);
          clearFilters();
          setSort('recent');
          // Show it right away (newest first), then sync with the server.
          setData((d) => ({ ...d, decks: [deck, ...d.decks] }));
          load();
        }}
      />
      <CreateCourseSheet
        visible={creatingCourse}
        onClose={() => setCreatingCourse(false)}
        onCreated={(course) => {
          setCreatingCourse(false);
          setData((d) => ({ ...d, courses: [...d.courses, course] }));
          setCourseId(course.id); // jump to the new course so "Create deck" files into it
          load();
        }}
      />
      <DeleteDeckSheet
        deck={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={(deck) => {
          setDeleting(null);
          setData((d) => ({ ...d, decks: d.decks.filter((x) => x.id !== deck.id) }));
          load();
        }}
      />
    </SafeAreaView>
  );
}
