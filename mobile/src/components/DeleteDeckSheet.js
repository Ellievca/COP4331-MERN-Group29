import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { deleteDeck } from '../api';
import { sheetStyles } from '../styles/components';
import { plural } from '../utils/format';
import Sheet from './Sheet';
import ErrorBanner from './ErrorBanner';
import DangerButton from './DangerButton';
import SecondaryButton from './SecondaryButton';

// "Are you sure?" before deleting a deck. `deck` is the deck to delete, or null when closed.
// Props: deck, onClose(), onDeleted(deck)
export default function DeleteDeckSheet({ deck, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (deck) {
      setDeleting(false);
      setError('');
    }
  }, [deck]);

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await deleteDeck(deck.id);
      onDeleted(deck);
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  const cards = deck?.cardCount ? `its ${plural(deck.cardCount, 'card')}` : 'it';
  return (
    <Sheet
      visible={Boolean(deck)}
      title={deck ? `Delete “${deck.title}”?` : ''}
      subtitle={`This removes the deck and ${cards} for good. Your study history stays.`}
      onClose={onClose}
      busy={deleting}
    >
      <ErrorBanner message={error} />
      <View style={sheetStyles.actions}>
        <SecondaryButton title="Keep it" onPress={onClose} style={sheetStyles.action} />
        <DangerButton
          title="Delete deck"
          onPress={handleDelete}
          loading={deleting}
          style={sheetStyles.action}
        />
      </View>
    </Sheet>
  );
}
