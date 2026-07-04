import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export type CurrentLocation = {
  lat: number;
  lng: number;
};

export const useCurrentLocation = (): {
  location: CurrentLocation | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<CurrentLocation | null>;
} => {
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setError('Location permission is required for nearby discovery.');
        return null;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = {
        lat: current.coords.latitude,
        lng: current.coords.longitude,
      };
      setLocation(next);
      return next;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Location lookup failed.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, loading, error, refreshLocation };
};
