import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { usePreferencesStore } from '../stores/preferencesStore';

export default function Index(): JSX.Element {
  const { isLoaded, isSignedIn } = useAuth();
  const onboardingComplete = usePreferencesStore((state) => state.onboardingComplete);
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!onboardingComplete) {
      router.replace('/(auth)/onboarding');
    } else if (!isSignedIn) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(tabs)/discover');
    }
  }, [isLoaded, isSignedIn, onboardingComplete, router]);

  return <></>;
}
