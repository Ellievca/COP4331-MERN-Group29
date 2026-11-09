// Temporary stand-in for the Deck and Study screens until we build them.
// AppNavigator.js passes the icon and message; navigating here passes the deck's title.
import { Text, View } from 'react-native';
import { common } from '../styles/common';
import EmptyState from '../components/EmptyState';

export default function ComingSoonScreen({ route }) {
  const { icon = 'construct-outline', message, title } = route.params || {};
  return (
    <View style={common.messagePage}>
      <EmptyState icon={icon} title={title ? `“${title}”` : 'Coming soon'} text={message} />
      <Text style={common.messageText}>Use the back button to return.</Text>
    </View>
  );
}
