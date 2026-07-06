import { useAuth } from '@clerk/clerk-expo';
import { ShieldAlert } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../constants/theme';
import { useCurrentLocation, type CurrentLocation } from '../hooks/useCurrentLocation';
import { apiRequest } from '../services/api';
import { GlassCard } from './GlassCard';
import { PrimaryButton } from './PrimaryButton';

type SOSButtonProps = {
  emergencyContact?: string;
};

type EmergencyNumbers = {
  police: string;
  ambulance: string;
  fire: string;
  country: string;
};

type SOSConfirmation = {
  sent: boolean;
  recipients: readonly {
    id: string;
    name: string;
    phone: string;
    relationship: string;
    status?: 'success' | 'failed';
  }[];
  message: string;
  location: CurrentLocation;
  dispatchedAt: string;
};

const formatLocation = (location: CurrentLocation): string =>
  `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;

export const SOSButton = (_props: SOSButtonProps): JSX.Element => {
  const { getToken } = useAuth();
  const { error: locationError, refreshLocation } = useCurrentLocation();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [numbers, setNumbers] = useState<EmergencyNumbers | null>(null);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const loadEmergencyNumbers = async (): Promise<void> => {
    setModalVisible(true);
    setLoading(true);
    setError(null);
    setConfirmation(null);

    try {
      const nextLocation = await refreshLocation();
      if (!nextLocation) {
        throw new Error(locationError ?? 'Unable to find your current GPS location.');
      }

      setCurrentLocation(nextLocation);
      const data = await apiRequest<EmergencyNumbers>(
        `/api/v1/utilities/emergency-contacts?lat=${encodeURIComponent(
          String(nextLocation.lat),
        )}&lng=${encodeURIComponent(String(nextLocation.lng))}`,
      );
      setNumbers(data);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load emergency numbers.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const sendSOSAlert = async (): Promise<void> => {
    if (!currentLocation) {
      setError('GPS location is required before sending an SOS alert.');
      return;
    }

    setSending(true);
    setError(null);
    setConfirmation(null);

    try {
      const token = await getToken();
      const data = await apiRequest<SOSConfirmation>('/api/v1/utilities/sos', {
        method: 'POST',
        token,
        body: {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          message: 'Traveling SOS: I need help.',
        },
      });
      
      const failed = data.recipients.filter(r => r.status === 'failed');
      const succeeded = data.recipients.filter(r => r.status === 'success');
      
      if (failed.length === 0) {
        setConfirmation(`SOS sent successfully to ${succeeded.length} contact(s).`);
      } else if (succeeded.length > 0) {
        setError(`SOS partially failed. Sent to ${succeeded.length}, failed for ${failed.length}.`);
      } else {
        setError(`Failed to send SOS to any of your ${failed.length} contact(s).`);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to send SOS alert.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="SOS emergency button"
        accessibilityHint="Shows local emergency numbers and lets you send an SOS alert."
        accessibilityState={{ disabled: loading }}
        activeOpacity={0.85}
        className="absolute bottom-24 right-5 flex-row items-center gap-2 rounded-full px-4 py-3 shadow-lg"
        disabled={loading}
        style={{ backgroundColor: theme.colors.danger }}
        onPress={() => {
          void loadEmergencyNumbers();
        }}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.text} size="small" />
        ) : (
          <ShieldAlert size={18} color={theme.colors.text} />
        )}
        <Text className="font-inter-bold text-white">{loading ? 'SOS...' : 'SOS'}</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/70 px-5 pb-8">
          <GlassCard accessibilityViewIsModal>
            <View className="gap-4">
              <View>
                <Text className="font-inter-bold text-2xl text-white">Emergency help</Text>
                <Text className="mt-1 font-inter text-sm text-zinc-300">
                  Local numbers are based on your current GPS location.
                </Text>
              </View>

              {loading ? (
                <View className="flex-row items-center gap-3 rounded-lg bg-white/10 p-3">
                  <ActivityIndicator color={theme.colors.text} />
                  <Text className="font-inter text-sm text-zinc-300">
                    Finding local emergency numbers...
                  </Text>
                </View>
              ) : null}

              {numbers ? (
                <View className="gap-3">
                  <Text className="font-inter-semibold text-white">{numbers.country}</Text>
                  <View className="flex-row gap-2">
                    <View className="flex-1 rounded-lg bg-white/10 p-3">
                      <Text className="font-inter text-xs text-zinc-400">Police</Text>
                      <Text className="mt-1 font-inter-bold text-xl text-white">
                        {numbers.police}
                      </Text>
                    </View>
                    <View className="flex-1 rounded-lg bg-white/10 p-3">
                      <Text className="font-inter text-xs text-zinc-400">Fire</Text>
                      <Text className="mt-1 font-inter-bold text-xl text-white">
                        {numbers.fire}
                      </Text>
                    </View>
                    <View className="flex-1 rounded-lg bg-white/10 p-3">
                      <Text className="font-inter text-xs text-zinc-400">Ambulance</Text>
                      <Text className="mt-1 font-inter-bold text-xl text-white">
                        {numbers.ambulance}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {currentLocation ? (
                <Text className="font-inter text-xs text-zinc-400">
                  GPS: {formatLocation(currentLocation)}
                </Text>
              ) : null}

              {error ? (
                <Text className="rounded-lg bg-accent/20 p-3 font-inter-semibold text-accent">
                  {error}
                </Text>
              ) : null}

              {confirmation ? (
                <Text className="rounded-lg bg-success/20 p-3 font-inter-semibold text-success">
                  {confirmation}
                </Text>
              ) : null}

              <View className="gap-2">
                <PrimaryButton
                  label="Send SOS alert"
                  icon={ShieldAlert}
                  loading={sending}
                  disabled={!currentLocation || loading}
                  onPress={() => {
                    void sendSOSAlert();
                  }}
                />
                <PrimaryButton
                  label="Close"
                  variant="ghost"
                  onPress={() => setModalVisible(false)}
                />
              </View>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
};
