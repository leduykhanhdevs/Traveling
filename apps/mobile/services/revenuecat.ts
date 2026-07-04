import Constants from 'expo-constants';

export type PurchaseResult = {
  status: 'unavailable-in-expo-go' | 'ready';
  message: string;
};

export const configureRevenueCat = async (_userId?: string): Promise<PurchaseResult> => {
  if (Constants.appOwnership === 'expo') {
    return {
      status: 'unavailable-in-expo-go',
      message: 'RevenueCat purchases are enabled in EAS development and production builds.',
    };
  }

  return {
    status: 'ready',
    message: 'RevenueCat native SDK is available for EAS builds.',
  };
};
