import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { sessionStyles as styles } from '../styles/components';
import { dateLabel, plural, sessionMinutes } from '../utils/format';

// One finished study session: deck name, date, length, and how many cards you got right.
export default function SessionRow({ session, deckTitle }) {
  const title = deckTitle || session.deckTitle || 'Study session';
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name="book-outline" size={18} color={colors.purple} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta}>
          {dateLabel(session.startedAt)} · {sessionMinutes(session)} min ·{' '}
          {plural(session.cardsReviewed, 'card')}
        </Text>
      </View>
      <View
        style={styles.pill}
        accessible
        accessibilityLabel={`${session.cardsCorrect} of ${session.cardsReviewed} recalled`}
      >
        <Ionicons name="checkmark" size={13} color={colors.success} />
        <Text style={styles.pillText}>
          {session.cardsCorrect}/{session.cardsReviewed}
        </Text>
      </View>
    </View>
  );
}
