import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '../styles/theme';
import { dangerStyles as styles } from '../styles/components';

// Red button for actions that can't be undone, like deleting a deck.
export default function DangerButton({ title, onPress, loading = false, style }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.text}>{title}</Text>}
    </Pressable>
  );
}
