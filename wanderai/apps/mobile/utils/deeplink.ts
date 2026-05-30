import * as Linking from 'expo-linking';

export type DeepLinkScreen = 'discover' | 'itinerary';

type DeepLinkParams = {
  discover: {
    placeId: string;
  };
  itinerary: {
    id: string;
  };
};

export function createDeepLink(screen: 'discover', params: DeepLinkParams['discover']): string;
export function createDeepLink(screen: 'itinerary', params: DeepLinkParams['itinerary']): string;
export function createDeepLink(
  screen: DeepLinkScreen,
  params: DeepLinkParams[DeepLinkScreen],
): string {
  if (screen === 'discover' && 'placeId' in params) {
    return Linking.createURL(`discover/${encodeURIComponent(params.placeId)}`, {
      scheme: 'wanderai',
    });
  }

  if (screen === 'itinerary' && 'id' in params) {
    return Linking.createURL(`itinerary/${encodeURIComponent(params.id)}`, {
      scheme: 'wanderai',
    });
  }

  throw new Error(`Invalid deep link params for ${screen}.`);
}
