import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { studyStyles as styles } from '../styles/components';

const HALF_FLIP_MS = 130;

// The big study card. Tap it to flip between question and answer.
// The flip squeezes the card to nothing, swaps sides at the midpoint, then opens it back up.
// Props: card { front, back }, flipped, onFlip() (called at the midpoint), disabled
// A parent can also flip it with ref.current.flip() (used by the "Show answer" button).
const FlipCard = forwardRef(function FlipCard({ card, flipped, onFlip, disabled = false }, ref) {
  const scale = useRef(new Animated.Value(1)).current;
  const animating = useRef(false);

  function flip() {
    if (disabled || animating.current) return;
    animating.current = true;
    Animated.timing(scale, { toValue: 0, duration: HALF_FLIP_MS, useNativeDriver: true }).start(() => {
      onFlip();
      Animated.timing(scale, { toValue: 1, duration: HALF_FLIP_MS, useNativeDriver: true }).start(
        () => {
          animating.current = false;
        },
      );
    });
  }

  useImperativeHandle(ref, () => ({ flip }));

  const text = flipped ? card.back : card.front;
  return (
    // The only inline style in the app: it holds the live animation value, which can't live in src/styles/.
    <Animated.View style={{ transform: [{ scaleX: scale }] }}>
      <Pressable
        style={[styles.card, flipped && styles.cardBack]}
        onPress={flip}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={flipped ? 'Answer. Tap to see the question.' : 'Question. Tap to reveal the answer.'}
      >
        <View style={styles.cardLabel}>
          <Ionicons
            name={flipped ? 'sparkles-outline' : 'book-outline'}
            size={15}
            color={colors.purple}
          />
          <Text style={styles.cardLabelText}>
            {flipped ? 'THE LIGHTBULB MOMENT' : 'A LITTLE QUESTION FOR YOU'}
          </Text>
        </View>

        <Text
          style={[styles.cardContent, text.length > 140 && styles.cardContentLong]}
          accessibilityLiveRegion="polite"
        >
          {text}
        </Text>

        <View style={styles.cardHint}>
          <Ionicons name="refresh" size={14} color={colors.muted} />
          <Text style={styles.cardHintText}>
            {flipped ? 'Tap to see the question' : 'Think it through, then tap to reveal'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default FlipCard;
