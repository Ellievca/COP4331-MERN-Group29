import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getCurrentUser, setUnauthorizedHandler } from './src/api';
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

  function handleLoggedOut() {
    setUser(null);
    setAuthScreen('login');
  }

  // Temporary until the Decks, Deck, Study and History screens exist.
  const comingNext = (what) => () => Alert.alert('Coming next', `${what} is the next screen we build.`);

  let screen;
  if (checking) {
    screen = (
      <View style={common.loading}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  } else if (user) {
    screen = (
      <HomeScreen
        user={user}
        onLoggedOut={handleLoggedOut}
        onOpenDeck={comingNext('The deck screen')}
        onStudyDeck={comingNext('Study mode')}
        onSeeAllDecks={comingNext('The decks screen')}
        onSeeHistory={comingNext('The history screen')}
        onCreateDeck={comingNext('Creating decks')}
      />
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
