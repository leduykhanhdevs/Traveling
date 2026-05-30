import { Stack } from 'expo-router';
import { theme } from '../../../constants/theme';

export default function ItineraryStackLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        headerShown: false,
      }}
    />
  );
}
