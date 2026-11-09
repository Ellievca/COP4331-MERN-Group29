import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { register } from '../api';
import { validateRegister } from '../validation';
import { colors } from '../styles/theme';
import { common } from '../styles/common';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';

const EMPTY = { firstName: '', lastName: '', email: '', username: '', password: '', confirm: '' };

// Props:
//   onRegistered(user) – called after the account is created and signed in
//   onBack()           – go back to the login screen
export default function RegisterScreen({ onRegistered, onBack }) {
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Refs let the keyboard's "next" key jump to the following box.
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  // Android's back button returns to login instead of closing the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!loading) onBack();
      return true;
    });
    return () => sub.remove();
  }, [loading, onBack]);

  // Update one field, and clear its error as soon as the user starts fixing it.
  function update(name) {
    return (value) => {
      setForm((f) => ({ ...f, [name]: value }));
      if (fieldErrors[name]) setFieldErrors((e) => ({ ...e, [name]: undefined }));
    };
  }

  async function handleRegister() {
    if (loading) return;
    const problems = validateRegister(form);
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) {
      setError('');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      onRegistered(user);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={common.safe}>
      <KeyboardAvoidingView
        style={common.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={common.scroll} keyboardShouldPersistTaps="handled">
          <Pressable
            style={common.back}
            onPress={onBack}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={colors.purple} />
            <Text style={common.backText}>Sign in</Text>
          </Pressable>

          <View style={common.card}>
            <Text style={common.title}>Create your account</Text>
            <Text style={common.subtitle}>Your next chapter starts with a few details.</Text>

            <ErrorBanner message={error} />

            <View style={common.row}>
              <FormField
                style={common.half}
                label="First name"
                value={form.firstName}
                onChangeText={update('firstName')}
                error={fieldErrors.firstName}
                placeholder="Alex"
                autoCapitalize="words"
                autoComplete="given-name"
                textContentType="givenName"
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
                editable={!loading}
              />
              <FormField
                ref={lastNameRef}
                style={common.half}
                label="Last name"
                value={form.lastName}
                onChangeText={update('lastName')}
                error={fieldErrors.lastName}
                placeholder="Morgan"
                autoCapitalize="words"
                autoComplete="family-name"
                textContentType="familyName"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                editable={!loading}
              />
            </View>

            <FormField
              ref={emailRef}
              label="Email"
              value={form.email}
              onChangeText={update('email')}
              error={fieldErrors.email}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => usernameRef.current?.focus()}
              editable={!loading}
            />

            <FormField
              ref={usernameRef}
              label="Username"
              value={form.username}
              onChangeText={update('username')}
              error={fieldErrors.username}
              placeholder="Choose your username"
              hint="3–32 characters."
              autoComplete="username-new"
              textContentType="username"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
            />

            <FormField
              ref={passwordRef}
              label="Password"
              password
              value={form.password}
              onChangeText={update('password')}
              error={fieldErrors.password}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              editable={!loading}
            />

            <FormField
              ref={confirmRef}
              label="Confirm password"
              password
              value={form.confirm}
              onChangeText={update('confirm')}
              error={fieldErrors.confirm}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleRegister}
              editable={!loading}
            />

            <PrimaryButton title="Create account" onPress={handleRegister} loading={loading} />
          </View>

          <View style={common.footer}>
            <Text style={common.footerText}>Already have an account? </Text>
            <Pressable onPress={onBack} disabled={loading} hitSlop={8}>
              <Text style={common.link}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
