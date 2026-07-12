import { jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('zustand/middleware', () => ({
  createJSONStorage: <TStorage>(getStorage: () => TStorage): TStorage => getStorage(),
  persist: <TStateCreator>(stateCreator: TStateCreator): TStateCreator => stateCreator,
}));

jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 3,
  },
  PermissionStatus: {
    DENIED: 'denied',
    GRANTED: 'granted',
    UNDETERMINED: 'undetermined',
  },
  getCurrentPositionAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  impactAsync: jest.fn(),
}));

jest.mock('expo-audio', () => ({
  useAudioRecorder: jest.fn(),
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn(),
}));

jest.mock(
  'expo-document-picker',
  () => ({
    getDocumentAsync: jest.fn(),
  }),
  { virtual: true },
);

jest.mock('expo-file-system', () => ({
  EncodingType: {
    Base64: 'base64',
  },
  copyAsync: jest.fn(),
  documentDirectory: 'file:///documents/',
  makeDirectoryAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  EncodingType: {
    Base64: 'base64',
  },
  copyAsync: jest.fn(),
  documentDirectory: 'file:///documents/',
  makeDirectoryAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: {
    Images: 'Images',
  },
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));
