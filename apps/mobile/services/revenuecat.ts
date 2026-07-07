import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';

const API_KEY_APPLE = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'PLACEHOLDER_RC_APPLE_KEY';
const API_KEY_GOOGLE = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'PLACEHOLDER_RC_GOOGLE_KEY';

export type PurchaseResult = {
  status: 'unavailable-in-expo-go' | 'ready' | 'error' | 'success';
  message: string;
};

export const configureRevenueCat = async (userId?: string): Promise<PurchaseResult> => {
  if (Constants.appOwnership === 'expo') {
    return {
      status: 'unavailable-in-expo-go',
      message: 'RevenueCat purchases are enabled in EAS development and production builds.',
    };
  }

  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: API_KEY_APPLE, appUserID: userId });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: API_KEY_GOOGLE, appUserID: userId });
    }
    
    return {
      status: 'ready',
      message: 'RevenueCat native SDK is configured.',
    };
  } catch (error: unknown) {
    const e = error as any;
    return {
      status: 'error',
      message: e.message || 'Failed to configure RevenueCat.',
    };
  }
};

export const getOfferings = async () => {
  if (Constants.appOwnership === 'expo') return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error fetching offerings', error);
    return null;
  }
};

export const purchasePackage = async (pack: PurchasesPackage): Promise<PurchaseResult> => {
  if (Constants.appOwnership === 'expo') {
    return { status: 'unavailable-in-expo-go', message: 'Not available in Expo Go' };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pack);
    // Standard entitlement identifier we will use in setup is "Premium" or "premium"
    if (typeof customerInfo.entitlements.active['premium'] !== 'undefined' || typeof customerInfo.entitlements.active['Premium'] !== 'undefined') {
      return { status: 'success', message: 'Purchase successful!' };
    }
    return { status: 'error', message: 'Purchase successful but entitlement not active.' };
  } catch (error: unknown) {
    const e = error as any;
    if (!e.userCancelled) {
      console.error('Purchase error', error);
    }
    return { status: 'error', message: e.message || 'Purchase failed.' };
  }
};

export const restorePurchases = async (): Promise<PurchaseResult> => {
  if (Constants.appOwnership === 'expo') {
    return { status: 'unavailable-in-expo-go', message: 'Not available in Expo Go' };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    if (typeof customerInfo.entitlements.active['premium'] !== 'undefined' || typeof customerInfo.entitlements.active['Premium'] !== 'undefined') {
      return { status: 'success', message: 'Purchases restored successfully!' };
    }
    return { status: 'error', message: 'No active premium entitlements found.' };
  } catch (error: unknown) {
    const e = error as any;
    return { status: 'error', message: e.message || 'Failed to restore purchases.' };
  }
};
