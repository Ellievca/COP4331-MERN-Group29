import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { heroStyles as styles } from '../styles/components';

// The lavender "Let's study" banner. `deck` is the deck the button will open (or null).
export default function StudyHero({ deck, onPress }) {
  return (
    <View style={styles.box}>
      <View style={styles.ring} />
      <View style={[styles.ring, styles.ringSmall]} />

      <Text style={styles.eyebrow}>✦ MAKE ROOM FOR YOUR NEXT AHA</Text>
      <Text style={styles.title}>Small sessions.{'\n'}Big lightbulb moments.</Text>
      <Text style={styles.text}>Pick a deck, find your rhythm, and make a little progress.</Text>
      {deck ? (
        <Text style={styles.upNext} numberOfLines={1}>
          Up next: <Text style={styles.upNextTitle}>{deck.title}</Text>
        </Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={deck ? `Study ${deck.title}` : 'Choose a deck to study'}
      >
        <Ionicons name="book-outline" size={17} color={colors.white} />
        <Text style={styles.buttonText}>{deck ? 'Let’s study' : 'Choose a deck'}</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.white} />
      </Pressable>
    </View>
  );
}
