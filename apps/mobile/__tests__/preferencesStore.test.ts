import { beforeEach, describe, expect, it } from '@jest/globals';
import { usePreferencesStore } from '../stores/preferencesStore';

describe('preferencesStore', () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      preferredLanguage: 'en',
      dietaryRestrictions: [],
      travelStyle: 'local',
      spicyPreference: 3,
      sweetPreference: 3,
      savoryPreference: 3,
      onboardingComplete: false,
    });
  });

  it('starts with the default personalization profile', () => {
    expect(usePreferencesStore.getState()).toMatchObject({
      preferredLanguage: 'en',
      dietaryRestrictions: [],
      travelStyle: 'local',
      spicyPreference: 3,
      sweetPreference: 3,
      savoryPreference: 3,
      onboardingComplete: false,
    });
  });

  it('updates language and travel style preferences', () => {
    usePreferencesStore.getState().setPreferredLanguage('vi');
    usePreferencesStore.getState().setTravelStyle('culture');

    expect(usePreferencesStore.getState().preferredLanguage).toBe('vi');
    expect(usePreferencesStore.getState().travelStyle).toBe('culture');
  });

  it('toggles dietary restrictions on and off', () => {
    usePreferencesStore.getState().toggleDietaryRestriction('vegan');
    usePreferencesStore.getState().toggleDietaryRestriction('halal');
    usePreferencesStore.getState().toggleDietaryRestriction('vegan');

    expect(usePreferencesStore.getState().dietaryRestrictions).toEqual(['halal']);
  });

  it('updates taste preferences and completes onboarding', () => {
    usePreferencesStore.getState().setTastePreference('spicyPreference', 5);
    usePreferencesStore.getState().setTastePreference('sweetPreference', 2);
    usePreferencesStore.getState().completeOnboarding();

    expect(usePreferencesStore.getState()).toMatchObject({
      spicyPreference: 5,
      sweetPreference: 2,
      onboardingComplete: true,
    });
  });
});
