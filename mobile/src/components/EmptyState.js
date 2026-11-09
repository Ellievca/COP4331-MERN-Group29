import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { emptyStyles as styles } from '../styles/components';

// Friendly box for when a list has nothing in it yet. `children` can be a button.
export default function EmptyState({ icon = 'sparkles-outline', title, text, children }) {
  return (
    <View style={styles.box}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={22} color={colors.purple} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
      {children}
    </View>
  );
}
