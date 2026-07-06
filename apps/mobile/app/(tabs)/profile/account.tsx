import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function AccountScreen(): JSX.Element {
  const [biometrics, setBiometrics] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('biometrics').then((v) => { if (v) setBiometrics(v === 'true'); });
    SecureStore.getItemAsync('twoFactor').then((v) => { if (v) setTwoFactor(v === 'true'); });
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
          <Text className="font-inter-bold text-3xl text-white">Account</Text>
        </View>

        <GlassCard>
          <View className="gap-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-inter-semibold text-lg text-white">Biometric Login</Text>
                <Text className="font-inter text-sm text-zinc-400">Use FaceID or Fingerprint.</Text>
              </View>
              <Switch value={biometrics} onValueChange={(v) => toggle('biometrics', v, setBiometrics)} />
            </View>
            <View className="h-px bg-white/10" />
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-inter-semibold text-lg text-white">Two-Factor Auth</Text>
                <Text className="font-inter text-sm text-zinc-400">Require 2FA for this device.</Text>
              </View>
              <Switch value={twoFactor} onValueChange={(v) => toggle('twoFactor', v, setTwoFactor)} />
            </View>
            <View className="h-px bg-white/10" />
            <Text className="font-inter text-sm text-zinc-300">
              Authentication is handled securely via Clerk. All details, active login sessions, and passwords can be modified directly on your Clerk dashboard or via OAuth provider settings.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
