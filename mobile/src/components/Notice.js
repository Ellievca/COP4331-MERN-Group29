import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { noticeStyles as styles } from '../styles/components';

// Green confirmation line, e.g. "Card added!". Renders nothing without a message.
export default function Notice({ message }) {
  if (!message) return null;
  return (
    <View style={styles.box} accessibilityLiveRegion="polite">
      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}
