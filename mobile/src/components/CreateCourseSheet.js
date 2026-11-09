import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { createCourse } from '../api';
import { validateCourse } from '../validation';
import { tints } from '../styles/theme';
import { chipStyles, sheetStyles } from '../styles/components';
import Sheet from './Sheet';
import FormField from './FormField';
import Chip from './Chip';
import ErrorBanner from './ErrorBanner';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

const EMPTY = { name: '', code: '', color: 'purple' };
const COLOR_NAMES = { purple: 'Lavender', blue: 'Blue', peach: 'Peach' };

// Pop-up form for a new course: name, optional code (e.g. COP4331), and a color.
// Props: visible, onClose(), onCreated(course)
export default function CreateCourseSheet({ visible, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const codeRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setForm(EMPTY);
      setFieldErrors({});
      setError('');
      setSaving(false);
    }
  }, [visible]);

  function update(name) {
    return (value) => {
      setForm((f) => ({ ...f, [name]: value }));
      if (fieldErrors[name]) setFieldErrors((e) => ({ ...e, [name]: undefined }));
    };
  }

  async function handleCreate() {
    if (saving) return;
    const problems = validateCourse(form);
    setFieldErrors(problems);
    if (Object.keys(problems).length) return;
    setError('');
    setSaving(true);
    try {
      const course = await createCourse(form);
      onCreated(course);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      title="New course"
      subtitle="Group your decks by class."
      onClose={onClose}
      busy={saving}
    >
      <ErrorBanner message={error} />

      <FormField
        label="Course name"
        value={form.name}
        onChangeText={update('name')}
        error={fieldErrors.name}
        placeholder="e.g. Software Engineering"
        autoCapitalize="words"
        maxLength={100}
        returnKeyType="next"
        onSubmitEditing={() => codeRef.current?.focus()}
        editable={!saving}
      />
      <FormField
        ref={codeRef}
        label="Course code"
        value={form.code}
        onChangeText={update('code')}
        error={fieldErrors.code}
        placeholder="e.g. COP4331"
        autoCapitalize="characters"
        maxLength={30}
        returnKeyType="done"
        editable={!saving}
      />

      <View style={sheetStyles.group}>
        <Text style={sheetStyles.fieldLabel}>Color</Text>
        <View style={chipStyles.wrapRow}>
          {Object.keys(tints).map((color) => (
            <Chip
              key={color}
              label={COLOR_NAMES[color]}
              dotColor={tints[color].dot}
              selected={form.color === color}
              onPress={() => update('color')(color)}
            />
          ))}
        </View>
      </View>

      <View style={sheetStyles.actions}>
        <SecondaryButton title="Cancel" onPress={onClose} style={sheetStyles.action} />
        <PrimaryButton
          title="Add course"
          onPress={handleCreate}
          loading={saving}
          style={sheetStyles.action}
        />
      </View>
    </Sheet>
  );
}
