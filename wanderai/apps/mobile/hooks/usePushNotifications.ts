import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { PermissionStatus } from 'expo-modules-core';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { apiRequest } from '../services/api';

type PushNotificationState = {
  token: string | null;
  registering: boolean;
  registered: boolean;
  error: string | null;
};

type ExpoPushTokenOptions = Parameters<typeof Notifications.getExpoPushTokenAsync>[0];

const initialState: PushNotificationState = {
  token: null,
  registering: false,
  registered: false,
  error: null,
};

const notificationPermissionRequest = {
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
  },
};

const isConfiguredProjectId = (projectId: unknown): projectId is string =>
  typeof projectId === 'string' &&
  projectId.trim().length > 0 &&
  projectId !== 'replace-with-eas-project-id';

const getProjectId = (): string | undefined => {
  if (isConfiguredProjectId(Constants.easConfig?.projectId)) {
    return Constants.easConfig.projectId;
  }

  const extraProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  return isConfiguredProjectId(extraProjectId) ? extraProjectId : undefined;
};

const requestNotificationPermission = async (): Promise<boolean> => {
  const currentPermission = await Notifications.getPermissionsAsync();
  const permission =
    currentPermission.status === PermissionStatus.UNDETERMINED
      ? await Notifications.requestPermissionsAsync(notificationPermissionRequest)
      : currentPermission;

  return permission.status === PermissionStatus.GRANTED;
};

export const usePushNotifications = (): PushNotificationState & {
  registerForPushNotifications: () => Promise<string | null>;
} => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [state, setState] = useState<PushNotificationState>(initialState);

  const registerForPushNotifications = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      return null;
    }

    setState((current) => ({
      ...current,
      registering: true,
      error: null,
    }));

    try {
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        setState((current) => ({
          ...current,
          registering: false,
          error: 'Push notification permission was not granted.',
        }));
        return null;
      }

      const projectId = getProjectId();
      const pushTokenOptions: ExpoPushTokenOptions = projectId ? { projectId } : undefined;
      const expoPushToken = await Notifications.getExpoPushTokenAsync(pushTokenOptions);
      const clerkToken = await getToken();

      if (!clerkToken) {
        throw new Error('A Clerk session token is required to register this device.');
      }

      await apiRequest('/api/v1/utilities/device-token', {
        method: 'POST',
        body: {
          platform: Platform.OS,
          token: expoPushToken.data,
        },
        token: clerkToken,
      });

      setState({
        token: expoPushToken.data,
        registering: false,
        registered: true,
        error: null,
      });
      return expoPushToken.data;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Push notification registration failed.';
      setState((current) => ({
        ...current,
        registering: false,
        registered: false,
        error: message,
      }));
      return null;
    }
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    void registerForPushNotifications();
  }, [registerForPushNotifications]);

  return {
    ...state,
    registerForPushNotifications,
  };
};
