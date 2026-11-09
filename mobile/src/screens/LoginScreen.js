import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../api';
import { colors } from '../styles/theme';
import { common } from '../styles/common';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';

// Props:
//   onLoggedIn(user)  – called with the user object after a successful login
//   onCreateAccount() – called when "Create an account" is tapped
export default function LoginScreen({ onLoggedIn, onCreateAccount }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef(null);

  async function handleLogin() {
    if (loading) return;
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      onLoggedIn(user);
    } catch (e) {
      setError(e.message);
      setPassword('');
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={common.safe}>
      <KeyboardAvoidingView
        style={common.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={common.scrollCentered} keyboardShouldPersistTaps="handled">
          <View style={common.brand}>
            <View style={common.logo}>
              <Ionicons name="book-outline" size={28} color={colors.white} />
            </View>
            <Text style={common.brandName}>StudySync</Text>
            <Text style={common.tagline}>A LITTLE MORE IN SYNC.</Text>
          </View>

          <View style={common.card}>
            <Text style={common.title}>Welcome back</Text>
            <Text style={common.subtitle}>Sign in to pick up where you left off.</Text>

            <ErrorBanner message={error} />

            <FormField
              label="Username or email"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username or email"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
            />

            <FormField
              ref={passwordRef}
              label="Password"
              password
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              editable={!loading}
            />

            <PrimaryButton title="Sign in" onPress={handleLogin} loading={loading} />
          </View>

          <View style={common.footer}>
            <Text style={common.footerText}>New around here? </Text>
            <Pressable onPress={onCreateAccount} disabled={loading} hitSlop={8}>
              <Text style={common.link}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
