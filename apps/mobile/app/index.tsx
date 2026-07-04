import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { usePreferencesStore } from '../stores/preferencesStore';

export default function Index(): JSX.Element {
  const { isLoaded, isSignedIn } = useAuth();
  const onboardingComplete = usePreferencesStore((state) => state.onboardingComplete);

  if (!isLoaded) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(tabs)/discover" />;
}
