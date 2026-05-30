import { act, renderHook } from '@testing-library/react-hooks';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Location from 'expo-location';
import { useCurrentLocation } from '../hooks/useCurrentLocation';

describe('useCurrentLocation', () => {
  const requestPermissionMock = jest.mocked(Location.requestForegroundPermissionsAsync);
  const getCurrentPositionMock = jest.mocked(Location.getCurrentPositionAsync);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the current GPS coordinates after permission is granted', async () => {
    requestPermissionMock.mockResolvedValue({
      status: Location.PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });
    getCurrentPositionMock.mockResolvedValue({
      coords: {
        latitude: 10.7769,
        longitude: 106.7009,
        altitude: null,
        accuracy: 10,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: 1,
    });
    const { result } = renderHook(() => useCurrentLocation());

    let location = null;
    await act(async () => {
      location = await result.current.refreshLocation();
    });

    expect(location).toEqual({ lat: 10.7769, lng: 106.7009 });
    expect(result.current.location).toEqual({ lat: 10.7769, lng: 106.7009 });
    expect(result.current.error).toBeNull();
    expect(getCurrentPositionMock).toHaveBeenCalledWith({ accuracy: Location.Accuracy.Balanced });
  });

  it('sets a permission error when location access is denied', async () => {
    requestPermissionMock.mockResolvedValue({
      status: Location.PermissionStatus.DENIED,
      granted: false,
      canAskAgain: true,
      expires: 'never',
    });
    const { result } = renderHook(() => useCurrentLocation());

    let location = null;
    await act(async () => {
      location = await result.current.refreshLocation();
    });

    expect(location).toBeNull();
    expect(result.current.location).toBeNull();
    expect(result.current.error).toBe('Location permission is required for nearby discovery.');
    expect(getCurrentPositionMock).not.toHaveBeenCalled();
  });

  it('captures lookup failures without throwing', async () => {
    requestPermissionMock.mockResolvedValue({
      status: Location.PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });
    getCurrentPositionMock.mockRejectedValue(new Error('GPS unavailable'));
    const { result } = renderHook(() => useCurrentLocation());

    let location = null;
    await act(async () => {
      location = await result.current.refreshLocation();
    });

    expect(location).toBeNull();
    expect(result.current.error).toBe('GPS unavailable');
    expect(result.current.loading).toBe(false);
  });
});
