import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { flashcardStyles as styles } from '../styles/components';
import { cardNumber } from '../utils/format';

// One flashcard: its number, the question, and the answer underneath.
// Tap it to edit (onPress); the trash button calls onDelete.
export default function FlashcardRow({ card, index, onPress, onDelete }) {
  const number = cardNumber(index);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Flashcard ${number}: ${card.front}. Tap to edit.`}
    >
      <View style={styles.top}>
        <Text style={styles.number}>{number}</Text>
        <Text style={styles.front}>{card.front}</Text>
        <Pressable
          onPress={onDelete}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Delete flashcard ${number}`}
        >
          <Ionicons name="trash-outline" size={18} color={colors.muted} />
        </Pressable>
      </View>
      <Text style={styles.back}>{card.back}</Text>
    </Pressable>
  );
}
