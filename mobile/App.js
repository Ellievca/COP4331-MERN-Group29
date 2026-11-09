import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getCurrentUser } from './src/api';
import { colors } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // When the app opens, ask the server if we're still signed in from last time.
  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null)) // offline or server down: just show login
      .finally(() => setChecking(false));
  }, []);

  let screen;
  if (checking) {
    screen = (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  } else if (user) {
    screen = <HomeScreen user={user} onLoggedOut={() => setUser(null)} />;
  } else {
    screen = (
      <LoginScreen
        onLoggedIn={setUser}
        onCreateAccount={() => Alert.alert('Coming next', 'The register screen is the next step.')}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {screen}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
