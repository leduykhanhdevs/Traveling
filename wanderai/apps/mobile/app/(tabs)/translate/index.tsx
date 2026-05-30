import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from '@tanstack/react-query';
import type { LanguageCode, OcrTextBlock, TranslationMode } from '@wanderai/shared';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { Camera, Keyboard, Mic, Volume2 } from 'lucide-react-native';
import { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { LanguagePicker } from '../../../components/LanguagePicker';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { TextField } from '../../../components/TextField';
import { theme } from '../../../constants/theme';
import { useHapticAction } from '../../../hooks/useHapticAction';
import { useVoiceRecorder } from '../../../hooks/useVoiceRecorder';
import { translateImage, translateText, transcribeAudio } from '../../../services/translation';
import { useOfflinePhrasesStore } from '../../../stores/offlinePhrasesStore';
import { usePreferencesStore } from '../../../stores/preferencesStore';
import { useSubscriptionStore } from '../../../stores/subscriptionStore';

const modes: readonly TranslationMode[] = ['keyboard', 'voice', 'camera'];

export default function TranslateScreen(): JSX.Element {
  const { getToken } = useAuth();
  const preferredLanguage = usePreferencesStore((state) => state.preferredLanguage);
  const [mode, setMode] = useState<TranslationMode>('keyboard');
  const [sourceText, setSourceText] = useState('');
  const [targetLang, setTargetLang] = useState<LanguageCode>(
    preferredLanguage === 'en' ? 'vi' : preferredLanguage,
  );
  const [conversationLang, setConversationLang] = useState<LanguageCode>('en');
  const [conversationTurn, setConversationTurn] = useState<'a' | 'b'>('a');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrBlocks, setOcrBlocks] = useState<readonly OcrTextBlock[]>([]);
  const recorder = useVoiceRecorder();
  const haptic = useHapticAction();
  const incrementTranslation = useSubscriptionStore((state) => state.incrementTranslation);
  const packs = useOfflinePhrasesStore((state) => state.packs);
  const downloadPack = useOfflinePhrasesStore((state) => state.downloadPack);

  const translation = useMutation({
    mutationFn: async (text: string) => {
      const token = await getToken();
      const activeTarget = conversationTurn === 'a' ? targetLang : conversationLang;
      return translateText(
        {
          sourceText: text,
          sourceLang: 'auto',
          targetLang: activeTarget,
        },
        token,
      );
    },
    onSuccess: (data) => {
      incrementTranslation();
      Speech.speak(data.translatedText, { language: data.targetLang });
      setConversationTurn((turn) => (turn === 'a' ? 'b' : 'a'));
    },
  });

  const cameraMutation = useMutation({
    mutationFn: async (base64: string) => {
      const token = await getToken();
      return translateImage(base64, targetLang, token);
    },
    onSuccess: (data) => {
      setOcrBlocks(data.blocks);
      incrementTranslation();
    },
  });

  const runKeyboardTranslation = async (): Promise<void> => {
    await haptic();
    if (sourceText.trim()) {
      translation.mutate(sourceText.trim());
    }
  };

  const stopVoiceTranslation = async (): Promise<void> => {
    await haptic();
    const audio = await recorder.stopRecording();
    if (!audio) {
      return;
    }
    try {
      const token = await getToken();
      const transcription = await transcribeAudio(audio.base64, 'auto', token);
      setSourceText(transcription.transcript);
      translation.mutate(transcription.transcript);
    } catch {
      // Keep the previous translation visible if transcription fails.
    }
  };

  const captureMenu = async (): Promise<void> => {
    await haptic();
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        base64: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]?.base64) {
        return;
      }
      setImageUri(result.assets[0].uri);
      cameraMutation.mutate(result.assets[0].base64);
    } catch {
      setOcrBlocks([]);
    }
  };

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-32 pt-5">
        <View>
          <Text className="font-inter-bold text-4xl text-white">Translate</Text>
          <Text className="mt-2 font-inter text-base text-zinc-300">
            Keyboard, voice, camera, and two-way conversation.
          </Text>
        </View>

        <SegmentedControl options={modes} value={mode} onChange={setMode} />

        <GlassCard>
          <Text className="mb-3 font-inter-semibold text-white">Target language</Text>
          <LanguagePicker value={targetLang} onChange={setTargetLang} />
          <Text className="mb-3 mt-4 font-inter-semibold text-white">Conversation partner</Text>
          <LanguagePicker value={conversationLang} onChange={setConversationLang} />
        </GlassCard>

        {mode === 'keyboard' ? (
          <GlassCard>
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <Keyboard size={18} color={theme.colors.text} />
                <Text className="font-inter-semibold text-white">Keyboard input</Text>
              </View>
              <TextField
                multiline
                className="min-h-32 text-top"
                value={sourceText}
                onChangeText={setSourceText}
                placeholder="Type text from a sign, menu, or conversation"
              />
              <PrimaryButton
                label="Translate"
                loading={translation.isPending}
                accessibilityHint="Translates the entered text into the selected target language."
                onPress={() => void runKeyboardTranslation()}
              />
            </View>
          </GlassCard>
        ) : null}

        {mode === 'voice' ? (
          <GlassCard>
            <View className="items-center gap-4 py-4">
              <TouchableOpacity
                accessibilityHint="Hold to record speech, then release to translate it."
                accessibilityLabel="Voice translation microphone"
                accessibilityRole="button"
                accessibilityState={{ selected: recorder.recording }}
                className={`h-28 w-28 items-center justify-center rounded-full ${
                  recorder.recording ? 'bg-accent' : 'bg-primary'
                }`}
                onPressIn={() => {
                  void recorder.startRecording();
                }}
                onPressOut={() => {
                  void stopVoiceTranslation();
                }}
              >
                <Mic size={40} color={theme.colors.text} />
              </TouchableOpacity>
              <Text className="font-inter text-zinc-300">
                {recorder.recording ? 'Release to translate' : 'Hold to record'}
              </Text>
            </View>
          </GlassCard>
        ) : null}

        {mode === 'camera' ? (
          <GlassCard>
            <View className="gap-3">
              <PrimaryButton
                label="Capture menu"
                icon={Camera}
                loading={cameraMutation.isPending}
                accessibilityHint="Opens the camera to capture a menu or sign for translation."
                onPress={() => void captureMenu()}
              />
              {imageUri ? (
                <View className="relative overflow-hidden rounded-lg">
                  <Image
                    accessibilityLabel="Captured image for camera translation"
                    source={{ uri: imageUri }}
                    className="h-96 w-full rounded-lg"
                  />
                  {ocrBlocks.map((block) => (
                    <View
                      key={`${block.text}-${block.boundingBox.x}-${block.boundingBox.y}`}
                      className="absolute rounded-md bg-background/80 px-2 py-1"
                      style={{
                        left: Math.max(4, block.boundingBox.x * 0.22),
                        top: Math.max(4, block.boundingBox.y * 0.22),
                        maxWidth: 260,
                      }}
                    >
                      <Text className="font-inter-semibold text-xs text-white">
                        {block.translatedText}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </GlassCard>
        ) : null}

        {translation.data ? (
          <GlassCard>
            <View className="flex-row items-center justify-between">
              <Text className="font-inter-semibold text-white">Translated output</Text>
              <TouchableOpacity
                accessibilityHint="Plays the translated output aloud."
                accessibilityLabel="Play translated output"
                accessibilityRole="button"
                onPress={() =>
                  Speech.speak(translation.data.translatedText, {
                    language: translation.data.targetLang,
                  })
                }
              >
                <Volume2 color={theme.colors.text} size={20} />
              </TouchableOpacity>
            </View>
            <Text className="mt-3 font-inter-bold text-2xl text-white">
              {translation.data.translatedText}
            </Text>
            <Text className="mt-3 font-inter text-sm text-zinc-300">
              IPA {translation.data.pronunciation.ipa}
            </Text>
            <Text className="font-inter text-sm text-zinc-300">
              Romanization {translation.data.pronunciation.romanization}
            </Text>
          </GlassCard>
        ) : null}

        <GlassCard>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-inter-semibold text-white">Offline Vietnam pack</Text>
              <Text className="font-inter text-sm text-zinc-300">
                {packs.vn?.length ?? 0} phrases available offline
              </Text>
            </View>
            <PrimaryButton
              label="Download"
              variant="ghost"
              accessibilityHint="Downloads the Vietnam offline phrase pack."
              onPress={() => downloadPack('vn')}
            />
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
