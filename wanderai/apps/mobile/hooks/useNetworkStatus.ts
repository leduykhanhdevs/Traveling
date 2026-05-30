import { useNetInfo } from '@react-native-community/netinfo';

export const useNetworkStatus = (): { isOffline: boolean; isConnected: boolean | null } => {
  const netInfo = useNetInfo();

  return {
    isConnected: netInfo.isConnected,
    isOffline: netInfo.isConnected === false,
  };
};
