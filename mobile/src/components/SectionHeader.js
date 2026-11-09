import { Pressable, Text, View } from 'react-native';
import { common } from '../styles/common';

// A section title with an optional subtitle and a "View all"-style link on the right.
export default function SectionHeader({ title, subtitle, linkText, onLinkPress }) {
  return (
    <View style={common.sectionHeader}>
      <View style={common.flex}>
        <Text style={common.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={common.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {linkText && onLinkPress ? (
        <Pressable onPress={onLinkPress} hitSlop={8} accessibilityRole="link">
          <Text style={common.textLink}>{linkText} →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
