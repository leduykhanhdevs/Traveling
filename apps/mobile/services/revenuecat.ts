import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';

const API_KEY_APPLE = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY?.trim();
const API_KEY_GOOGLE = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY?.trim();
const PREMIUM_ENTITLEMENT_ID = 'premium';

export type PurchaseResult = {
  status: 'unavailable-in-expo-go' | 'ready' | 'cancelled' | 'error' | 'success';
  message: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const errorMessage = (error: unknown, fallback: string): string =>
  isRecord(error) && typeof error.message === 'string' ? error.message : fallback;

export const configureRevenueCat = async (userId: string | null | undefined): Promise<PurchaseResult> => {
  if (Constants.appOwnership === 'expo') {
    return {
      status: 'unavailable-in-expo-go',
      message: 'RevenueCat purchases are enabled in EAS development and production builds.',
    };
  }

  if (!userId) {
    return { status: 'error', message: 'Sign in before managing a subscription.' };
  }

  const apiKey = Platform.OS === 'ios' ? API_KEY_APPLE : Platform.OS === 'android' ? API_KEY_GOOGLE : undefined;
  if (!apiKey) {
    return { status: 'error', message: 'Purchases are not configured for this platform.' };
  }

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
    if (await Purchases.isConfigured()) {
      const currentUserId = await Purchases.getAppUserID();
      if (currentUserId !== userId) {
        await Purchases.logIn(userId);
      }
    } else {
      Purchases.configure({ apiKey, appUserID: userId });
      await Purchases.setAllowSharingStoreAccount(false);
    }

    return {
      status: 'ready',
      message: 'RevenueCat native SDK is configured.',
    };
  } catch (error: unknown) {
    return {
      status: 'error',
      message: errorMessage(error, 'Failed to configure RevenueCat.'),
    };
  }
};

export const getOfferings = async () => {
  if (Constants.appOwnership === 'expo') return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
};

export const purchasePackage = async (pack: PurchasesPackage): Promise<PurchaseResult> => {
  if (Constants.appOwnership === 'expo') {
    return { status: 'unavailable-in-expo-go', message: 'Not available in Expo Go' };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pack);
    if (customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]) {
      return { status: 'success', message: 'Purchase successful!' };
    }
    return { status: 'error', message: 'Purchase successful but entitlement not active.' };
  } catch (error: unknown) {
    if (isRecord(error) && error.userCancelled === true) {
      return { status: 'cancelled', message: 'Purchase cancelled.' };
    }
    return { status: 'error', message: errorMessage(error, 'Purchase failed.') };
  }
};

export const restorePurchases = async (): Promise<PurchaseResult> => {
  if (Constants.appOwnership === 'expo') {
    return { status: 'unavailable-in-expo-go', message: 'Not available in Expo Go' };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    if (customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]) {
      return { status: 'success', message: 'Purchases restored successfully!' };
    }
    return { status: 'error', message: 'No active premium entitlements found.' };
  } catch (error: unknown) {
    return { status: 'error', message: errorMessage(error, 'Failed to restore purchases.') };
  }
};
