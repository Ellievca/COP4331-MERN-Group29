import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { logout } from '../api';
import { useAuth } from '../state/AuthContext';
import { common } from '../styles/common';
import { initials } from '../utils/format';
import SecondaryButton from '../components/SecondaryButton';

// Your name, username and email, plus Sign out. Opened from your initials on Home.
export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
    } catch {
      // Even if the server call fails, sign out on this phone.
    }
    signOut();
  }

  const rows = [
    ['Name', `${user.firstName} ${user.lastName}`],
    ['Username', `@${user.login}`],
    ['Email', user.email],
  ];

  return (
    <ScrollView contentContainerStyle={common.scroll}>
      <View style={common.card}>
        <View style={common.avatarLarge}>
          <Text style={common.avatarLargeText}>{initials(user)}</Text>
        </View>
        <Text style={[common.title, common.centerText]}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={[common.subtitle, common.centerText]}>@{user.login}</Text>
        {rows.map(([label, value]) => (
          <View key={label} style={common.infoRow}>
            <Text style={common.infoLabel}>{label}</Text>
            <Text style={common.infoValue} numberOfLines={1}>
              {value}
            </Text>
          </View>
        ))}
      </View>
      <View style={common.section}>
        <SecondaryButton title="Sign out" onPress={handleSignOut} loading={signingOut} />
      </View>
    </ScrollView>
  );
}
