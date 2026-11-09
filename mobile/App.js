import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getCurrentUser } from './src/api';
import { colors } from './src/styles/theme';
import { common } from './src/styles/common';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  // Which signed-out screen to show: 'login' or 'register'.
  const [authScreen, setAuthScreen] = useState('login');

  // When the app opens, ask the server if we're still signed in from last time.
  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null)) // offline or server down: just show login
      .finally(() => setChecking(false));
  }, []);

  function handleLoggedOut() {
    setUser(null);
    setAuthScreen('login');
  }

  let screen;
  if (checking) {
    screen = (
      <View style={common.loading}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  } else if (user) {
    screen = <HomeScreen user={user} onLoggedOut={handleLoggedOut} />;
  } else if (authScreen === 'register') {
    screen = <RegisterScreen onRegistered={setUser} onBack={() => setAuthScreen('login')} />;
  } else {
    screen = (
      <LoginScreen onLoggedIn={setUser} onCreateAccount={() => setAuthScreen('register')} />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {screen}
    </SafeAreaProvider>
  );
}
