import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '../styles/theme';
import { buttonStyles as styles } from '../styles/components';

// The light lavender button, for less important actions (e.g. Sign out).
export default function SecondaryButton({ title, onPress, loading = false, style }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.secondary,
        pressed && styles.secondaryPressed,
        loading && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.purple} />
      ) : (
        <Text style={styles.secondaryText}>{title}</Text>
      )}
    </Pressable>
  );
}
