// Temporary signed-in screen: proves login worked. The real dashboard replaces it later.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout } from '../api';
import { common } from '../styles/common';
import SecondaryButton from '../components/SecondaryButton';

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
    <SafeAreaView style={common.safe}>
      <View style={common.centered}>
        <Text style={common.eyebrow}>A FRESH PAGE, EVERY DAY</Text>
        <Text style={common.heading}>Let’s get in sync, {user.firstName}</Text>
        <Text style={common.headingSubtitle}>Signed in as @{user.login}</Text>
        <SecondaryButton title="Sign out" onPress={handleLogout} loading={loading} />
      </View>
    </SafeAreaView>
  );
}
