import { Pressable, Text, View } from 'react-native';
import { chipStyles as styles } from '../styles/components';

// A small rounded toggle button. Pass `dotColor` for a colored dot, `count` for a number.
export default function Chip({ label, selected = false, onPress, dotColor, count }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
      {count !== undefined ? <Text style={styles.count}>{count}</Text> : null}
    </Pressable>
  );
}
