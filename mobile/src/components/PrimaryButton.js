import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '../styles/theme';
import { buttonStyles as styles } from '../styles/components';

// The big purple button. Shows a spinner and ignores taps while `loading`.
export default function PrimaryButton({ title, onPress, loading = false, style }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primary,
        pressed && styles.primaryPressed,
        loading && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.primaryText}>{title}</Text>
      )}
    </Pressable>
  );
}
