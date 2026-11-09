import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { createCard, updateCard } from '../api';
import { validateCard } from '../validation';
import { sheetStyles } from '../styles/components';
import Sheet from './Sheet';
import FormField from './FormField';
import ErrorBanner from './ErrorBanner';
import Notice from './Notice';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

const EMPTY = { front: '', back: '' };

// Add a new flashcard, or edit one (pass `card`).
// Adding keeps the form open after each save so you can add several in a row.
// Props: visible, deck, card (to edit, optional), onClose(), onSaved(card)
export default function CardSheet({ visible, deck, card, onClose, onSaved }) {
  const editing = Boolean(card);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [added, setAdded] = useState(0); // how many cards added since opening
  const [saving, setSaving] = useState(false);
  const frontRef = useRef(null);
  const backRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setForm(card ? { front: card.front, back: card.back } : EMPTY);
      setFieldErrors({});
      setError('');
      setAdded(0);
      setSaving(false);
    }
  }, [visible, card]);

  function update(name) {
    return (value) => {
      setForm((f) => ({ ...f, [name]: value }));
      if (fieldErrors[name]) setFieldErrors((e) => ({ ...e, [name]: undefined }));
    };
  }

  async function handleSave() {
    if (saving) return;
    const problems = validateCard(form);
    setFieldErrors(problems);
    if (Object.keys(problems).length) return;
    setError('');
    setSaving(true);
    try {
      if (editing) {
        const saved = await updateCard(deck.id, card.id, form);
        onSaved(saved);
        return; // the screen closes the sheet
      }
      const saved = await createCard(deck.id, form);
      onSaved(saved);
      // Stay open, ready for the next card.
      setForm(EMPTY);
      setAdded((n) => n + 1);
      setSaving(false);
      frontRef.current?.focus();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      title={editing ? 'Edit flashcard' : 'One more lightbulb moment.'}
      subtitle={editing ? `In ${deck?.title}` : `Add a flashcard to ${deck?.title}.`}
      onClose={onClose}
      busy={saving}
    >
      <ErrorBanner message={error} />
      <Notice
        message={
          added
            ? `${added === 1 ? 'Card added!' : `${added} cards added!`} Add another, or tap Done.`
            : ''
        }
      />

      <FormField
        ref={frontRef}
        label="Front · question or term"
        value={form.front}
        onChangeText={update('front')}
        error={fieldErrors.front}
        placeholder="What do you want to remember?"
        autoCapitalize="sentences"
        autoCorrect
        multiline
        maxLength={1000}
        editable={!saving}
      />
      <FormField
        ref={backRef}
        label="Back · answer or definition"
        value={form.back}
        onChangeText={update('back')}
        error={fieldErrors.back}
        placeholder="The lightbulb moment goes here…"
        autoCapitalize="sentences"
        autoCorrect
        multiline
        maxLength={3000}
        editable={!saving}
      />

      <View style={sheetStyles.actions}>
        <SecondaryButton
          title={added ? 'Done' : 'Cancel'}
          onPress={onClose}
          style={sheetStyles.action}
        />
        <PrimaryButton
          title={editing ? 'Save changes' : 'Add card'}
          onPress={handleSave}
          loading={saving}
          style={sheetStyles.action}
        />
      </View>
    </Sheet>
  );
}
