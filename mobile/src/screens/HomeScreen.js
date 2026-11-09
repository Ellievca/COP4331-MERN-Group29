// Temporary signed-in screen: proves login worked. The real dashboard replaces it later.
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout } from '../api';
import { colors } from '../theme';

export default function HomeScreen({ user, onLoggedOut }) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await logout();
    } catch {
      // Even if the server call fails, sign out on this phone.
    }
    onLoggedOut();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>A FRESH PAGE, EVERY DAY</Text>
        <Text style={styles.title}>Let’s get in sync, {user.firstName}</Text>
        <Text style={styles.subtitle}>Signed in as @{user.login}</Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.purple} />
          ) : (
            <Text style={styles.buttonText}>Sign out</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: colors.muted, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 6, marginBottom: 32 },
  button: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: colors.purple, fontSize: 16, fontWeight: '700' },
});
