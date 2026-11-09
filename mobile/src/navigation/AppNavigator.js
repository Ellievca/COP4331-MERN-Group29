// How the signed-in part of the app is laid out:
//
//   Stack (screens slide in from the right, with a back button)
//   ├── Tabs  (bottom tab bar)
//   │   ├── Home
//   │   ├── Decks
//   │   └── History
//   ├── Deck      (one deck's cards)       ← opened from Home or Decks
//   ├── Study     (study mode)             ← opened from Home or a deck
//   └── Account   (your info + sign out)   ← opened from your initials on Home
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { navStyles } from '../styles/components';
import HomeScreen from '../screens/HomeScreen';
import DecksScreen from '../screens/DecksScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AccountScreen from '../screens/AccountScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab icons: filled when selected, outlined otherwise.
const TAB_ICONS = {
  Home: 'home',
  Decks: 'albums',
  History: 'time',
};

// Our colors for React Navigation's built-in parts (backgrounds, back button tint, ...).
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.purple,
    background: colors.background,
    card: colors.white,
    text: colors.ink,
    border: colors.border,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // each tab draws its own big heading
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: navStyles.tabBar,
        tabBarLabelStyle: navStyles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name] : `${TAB_ICONS[route.name]}-outline`}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Decks" component={DecksScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: navStyles.header,
          headerTitleStyle: navStyles.headerTitle,
          headerTintColor: colors.purple,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          contentStyle: navStyles.content,
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Deck"
          component={ComingSoonScreen}
          options={({ route }) => ({ title: route.params?.title || 'Deck' })}
          initialParams={{
            icon: 'layers-outline',
            message: 'Viewing and adding flashcards is the next screen we build.',
          }}
        />
        <Stack.Screen
          name="Study"
          component={ComingSoonScreen}
          options={{ title: 'Study' }}
          initialParams={{
            icon: 'bulb-outline',
            message: 'Study mode comes right after the deck screen.',
          }}
        />
        <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
