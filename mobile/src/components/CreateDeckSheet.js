import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { createDeck } from '../api';
import { validateDeck } from '../validation';
import { tintFor } from '../styles/theme';
import { chipStyles, sheetStyles } from '../styles/components';
import Sheet from './Sheet';
import FormField from './FormField';
import Chip from './Chip';
import ErrorBanner from './ErrorBanner';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

const EMPTY = { title: '', description: '', courseId: null };

// Pop-up form for a new deck: title, optional description, optional course.
// Props: visible, courses, defaultCourseId, onClose(), onCreated(deck)
export default function CreateDeckSheet({ visible, courses, defaultCourseId, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const descriptionRef = useRef(null);

  // Start fresh each time it opens (pre-selecting the course you're filtered to).
  useEffect(() => {
    if (visible) {
      setForm({ ...EMPTY, courseId: defaultCourseId || null });
      setFieldErrors({});
      setError('');
      setSaving(false);
    }
  }, [visible, defaultCourseId]);

  function update(name) {
    return (value) => {
      setForm((f) => ({ ...f, [name]: value }));
      if (fieldErrors[name]) setFieldErrors((e) => ({ ...e, [name]: undefined }));
    };
  }

  async function handleCreate() {
    if (saving) return;
    const problems = validateDeck(form);
    setFieldErrors(problems);
    if (Object.keys(problems).length) return;
    setError('');
    setSaving(true);
    try {
      const deck = await createDeck(form);
      onCreated(deck);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      title="Create a deck"
      subtitle="Start with one topic. You can add cards next."
      onClose={onClose}
      busy={saving}
    >
      <ErrorBanner message={error} />

      <FormField
        label="Title"
        value={form.title}
        onChangeText={update('title')}
        error={fieldErrors.title}
        placeholder="e.g. Midterm essentials"
        autoCapitalize="sentences"
        maxLength={80}
        returnKeyType="next"
        onSubmitEditing={() => descriptionRef.current?.focus()}
        editable={!saving}
      />
      <FormField
        ref={descriptionRef}
        label="Description (optional)"
        value={form.description}
        onChangeText={update('description')}
        error={fieldErrors.description}
        placeholder="What are we learning?"
        autoCapitalize="sentences"
        maxLength={240}
        editable={!saving}
      />

      {courses.length ? (
        <View style={sheetStyles.group}>
          <Text style={sheetStyles.fieldLabel}>Course (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chipStyles.row}>
            <Chip
              label="No course"
              selected={!form.courseId}
              onPress={() => update('courseId')(null)}
            />
            {courses.map((course) => (
              <Chip
                key={course.id}
                label={course.code || course.name}
                dotColor={tintFor(course.color).dot}
                selected={form.courseId === course.id}
                onPress={() => update('courseId')(course.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={sheetStyles.actions}>
        <SecondaryButton title="Cancel" onPress={onClose} style={sheetStyles.action} />
        <PrimaryButton
          title="Create deck"
          onPress={handleCreate}
          loading={saving}
          style={sheetStyles.action}
        />
      </View>
    </Sheet>
  );
}
