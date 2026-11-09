import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tintFor } from '../styles/theme';
import { statStyles as styles } from '../styles/components';

// One number tile, e.g. "12 / My decks". `tint` is 'purple', 'blue' or 'peach'.
export default function StatTile({ icon, value, label, tint = 'purple' }) {
  const colors = tintFor(tint);
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.icon, { backgroundColor: colors.fill }]}>
        <Ionicons name={icon} size={19} color={colors.ink} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
