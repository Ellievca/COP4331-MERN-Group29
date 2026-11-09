import { forwardRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { fieldStyles as styles } from '../styles/components';

// A labeled text box with an optional error or hint underneath.
// Pass `password` to get dots plus a show/hide eye button.
// Any other props (value, onChangeText, autoComplete, ...) go straight to TextInput.
const FormField = forwardRef(function FormField(
  { label, error, hint, password = false, style, ...inputProps },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          ref={ref}
          style={[styles.input, password && styles.inputWithEye, error && styles.inputError]}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={password && !visible}
          accessibilityLabel={label}
          {...inputProps}
        />
        {password ? (
          <Pressable
            style={styles.eye}
            onPress={() => setVisible((v) => !v)}
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            hitSlop={8}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

export default FormField;
