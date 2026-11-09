import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getCurrentUser, setUnauthorizedHandler } from './src/api';
import { AuthContext } from './src/state/AuthContext';
import { colors } from './src/styles/theme';
import { common } from './src/styles/common';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  // Which signed-out screen to show: 'login' or 'register'.
  const [authScreen, setAuthScreen] = useState('login');

  // When the app opens, ask the server if we're still signed in from last time.
  useEffect(() => {
    // If the session expires while the app is open, go back to the login screen.
    setUnauthorizedHandler(() => {
      setUser(null);
      setAuthScreen('login');
    });
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null)) // offline or server down: just show login
      .finally(() => setChecking(false));
  }, []);

  // What every signed-in screen can read with useAuth().
  const auth = useMemo(
    () => ({
      user,
      signOut: () => {
        setUser(null);
        setAuthScreen('login');
      },
    }),
    [user],
  );

  let screen;
  if (checking) {
    screen = (
      <View style={common.loading}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  } else if (user) {
    // Signed in: tab bar (Home / Decks / History) and the screens that open from it.
    screen = (
      <AuthContext.Provider value={auth}>
        <AppNavigator />
      </AuthContext.Provider>
    );
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
