import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, tintFor } from '../styles/theme';
import { deckStyles as styles } from '../styles/components';
import { plural } from '../utils/format';

// A deck in a list: course label, title, description, and card count.
// `course` is the deck's course object (or undefined if it has none).
// Pass `onDelete` to show a trash button.
export default function DeckCard({ deck, course, onPress, onDelete }) {
  const tint = tintFor(course?.color);
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${deck.title}, ${plural(deck.cardCount, 'card')}`}
    >
      {course ? (
        <View style={styles.course}>
          <View style={[styles.courseDot, { backgroundColor: tint.dot }]} />
          <Text style={[styles.courseText, { color: tint.ink }]} numberOfLines={1}>
            {course.code || course.name}
          </Text>
        </View>
      ) : null}
      <Text style={styles.title} numberOfLines={2}>
        {deck.title}
      </Text>
      {deck.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {deck.description}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <View style={styles.meta}>
          <Ionicons name="layers-outline" size={15} color={colors.muted} />
          <Text style={styles.metaText}>{plural(deck.cardCount, 'card')}</Text>
        </View>
        <View style={styles.actions}>
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${deck.title}`}
            >
              <Ionicons name="trash-outline" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </View>
    </Pressable>
  );
}
