import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function NotificationsScreen(): JSX.Element {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailDigest, setEmailDigest] = useState(false);
  const [flightReminders, setFlightReminders] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('pushEnabled').then((v) => { if (v) setPushEnabled(v === 'true'); });
    SecureStore.getItemAsync('emailDigest').then((v) => { if (v) setEmailDigest(v === 'true'); });
    SecureStore.getItemAsync('flightReminders').then((v) => { if (v) setFlightReminders(v === 'true'); });
  }, []);

  const toggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    void SecureStore.setItemAsync(key, value ? 'true' : 'false');
  };

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ gap: 16, padding: 20 }}>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            onPress={() => router.back()}
          >
            <ArrowLeft color="#FFFFFF" size={20} />
          </TouchableOpacity>
          <Text className="font-inter-bold text-3xl text-white">Notifications</Text>
        </View>

        <GlassCard>
          <View className="gap-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-inter-semibold text-lg text-white">Push Notifications</Text>
                <Text className="font-inter text-sm text-zinc-400">Receive alerts on your device.</Text>
              </View>
              <Switch value={pushEnabled} onValueChange={(v) => toggle('pushEnabled', v, setPushEnabled)} />
            </View>
            <View className="h-px bg-white/10" />
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-inter-semibold text-lg text-white">Email Digest</Text>
                <Text className="font-inter text-sm text-zinc-400">Weekly summary of trips and stats.</Text>
              </View>
              <Switch value={emailDigest} onValueChange={(v) => toggle('emailDigest', v, setEmailDigest)} />
            </View>
            <View className="h-px bg-white/10" />
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-inter-semibold text-lg text-white">Flight Reminders</Text>
                <Text className="font-inter text-sm text-zinc-400">Alerts for gate changes and delays.</Text>
              </View>
              <Switch value={flightReminders} onValueChange={(v) => toggle('flightReminders', v, setFlightReminders)} />
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
