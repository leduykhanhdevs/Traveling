import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { CalendarDays, Languages, Map, UserCircle, Users } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

export default function TabsLayout(): JSX.Element {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: 'rgba(255,255,255,0.1)',
          position: 'absolute',
        },
        tabBarBackground: () => <BlurView tint="dark" intensity={50} style={{ flex: 1 }} />,
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: t('tabs.discover'),
          tabBarIcon: ({ color }) => <Map size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="translate/index"
        options={{
          title: t('tabs.translate'),
          tabBarIcon: ({ color }) => <Languages size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="itinerary"
        options={{
          title: t('tabs.itinerary'),
          tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community/index"
        options={{
          title: t('tabs.community'),
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <UserCircle size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
