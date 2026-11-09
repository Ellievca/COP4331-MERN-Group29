import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { bannerStyles as styles } from '../styles/components';

// Red box for errors about the whole form (wrong password, no internet, ...).
export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}
