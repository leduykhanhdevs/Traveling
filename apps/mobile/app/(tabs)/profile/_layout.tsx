import { Stack } from 'expo-router';
import { theme } from '../../../constants/theme';

export default function ProfileStackLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        headerShown: false,
      }}
    />
  );
}
