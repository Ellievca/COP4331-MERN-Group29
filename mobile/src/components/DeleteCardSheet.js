import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { deleteCard } from '../api';
import { quoteStyles, sheetStyles } from '../styles/components';
import Sheet from './Sheet';
import ErrorBanner from './ErrorBanner';
import DangerButton from './DangerButton';
import SecondaryButton from './SecondaryButton';

// "Delete this flashcard?" with a preview of its question.
// Props: deckId, card (to delete, or null when closed), onClose(), onDeleted(card)
export default function DeleteCardSheet({ deckId, card, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (card) {
      setDeleting(false);
      setError('');
    }
  }, [card]);

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await deleteCard(deckId, card.id);
      onDeleted(card);
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  return (
    <Sheet
      visible={Boolean(card)}
      title="Delete this flashcard?"
      subtitle="This removes both the question and answer. This can’t be undone."
      onClose={onClose}
      busy={deleting}
    >
      <ErrorBanner message={error} />
      {card ? (
        <View style={quoteStyles.box}>
          <Text style={quoteStyles.text} numberOfLines={4}>
            {card.front}
          </Text>
        </View>
      ) : null}
      <View style={sheetStyles.actions}>
        <SecondaryButton title="Keep card" onPress={onClose} style={sheetStyles.action} />
        <DangerButton
          title="Delete card"
          onPress={handleDelete}
          loading={deleting}
          style={sheetStyles.action}
        />
      </View>
    </Sheet>
  );
}
