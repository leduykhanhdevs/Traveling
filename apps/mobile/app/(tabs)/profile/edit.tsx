import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { theme } from '../../../constants/theme';
import { apiRequest } from '../../../services/api';

export default function EditProfileScreen(): JSX.Element {
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    preferredLanguage: 'en',
    travelStyle: 'local',
    nationality: '',
    spicyPreference: '3',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await getToken();
        const data = await apiRequest<{ user?: { preferredLanguage?: string, travelStyle?: string, nationality?: string, spicyPreference?: number } }>('/api/v1/profile', { token });
        if (data.user) {
          setForm({
            preferredLanguage: data.user.preferredLanguage ?? 'en',
            travelStyle: data.user.travelStyle ?? 'local',
            nationality: data.user.nationality ?? '',
            spicyPreference: String(data.user.spicyPreference ?? 3),
          });
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, [getToken]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest('/api/v1/profile', {
        method: 'PUT',
        token,
        body: {
          email: `${userId}@traveling.local`, // backend ignores this or updates, but must be unique email
          preferredLanguage: form.preferredLanguage,
          dietaryRestrictions: [],
          travelStyle: form.travelStyle,
          spicyPreference: parseInt(form.spicyPreference, 10) || 3,
          sweetPreference: 3,
          savoryPreference: 3,
          nationality: form.nationality,
        },
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
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
          <Text className="font-inter-bold text-3xl text-white">Edit Profile</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.colors.text} className="mt-10" />
        ) : (
          <>
            <GlassCard>
              <View className="gap-4">
                <Text className="font-inter-bold text-lg text-white">Language</Text>
                <TextInput
                  value={form.preferredLanguage}
                  onChangeText={(t) => setForm({ ...form, preferredLanguage: t })}
                  className="rounded-lg bg-white/10 p-4 font-inter text-white"
                  placeholderTextColor="#a1a1aa"
                  placeholder="e.g. en, fr, vi"
                />

                <Text className="font-inter-bold text-lg text-white mt-2">Travel Style</Text>
                <TextInput
                  value={form.travelStyle}
                  onChangeText={(t) => setForm({ ...form, travelStyle: t })}
                  className="rounded-lg bg-white/10 p-4 font-inter text-white"
                  placeholderTextColor="#a1a1aa"
                  placeholder="e.g. local, luxury, budget"
                />

                <Text className="font-inter-bold text-lg text-white mt-2">Nationality</Text>
                <TextInput
                  value={form.nationality}
                  onChangeText={(t) => setForm({ ...form, nationality: t })}
                  className="rounded-lg bg-white/10 p-4 font-inter text-white"
                  placeholderTextColor="#a1a1aa"
                  placeholder="e.g. US, VN"
                />
                
                <Text className="font-inter-bold text-lg text-white mt-2">Spicy Preference (1-5)</Text>
                <TextInput
                  value={form.spicyPreference}
                  onChangeText={(t) => setForm({ ...form, spicyPreference: t })}
                  keyboardType="numeric"
                  className="rounded-lg bg-white/10 p-4 font-inter text-white"
                  placeholderTextColor="#a1a1aa"
                  placeholder="1 to 5"
                />
              </View>
            </GlassCard>

            {error && <Text className="text-accent text-center font-inter-semibold">{error}</Text>}

            <PrimaryButton label="Save Changes" onPress={() => { void handleSave(); }} loading={saving} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
