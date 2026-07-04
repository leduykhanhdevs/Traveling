import { SUPPORTED_LANGUAGES, type LanguageCode } from '@traveling/shared';
import { ArrowLeftRight, BookOpen, Mic, Send, Volume2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguagePicker } from '../../../components/LanguagePicker';
import { PhrasebookSheet, type PhrasebookPhrase } from '../../../components/PhrasebookSheet';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { TextField } from '../../../components/TextField';
import {
  TranslationBubble,
  type TranslationBubbleMessage,
} from '../../../components/TranslationBubble';
import { theme } from '../../../constants/theme';
import { useVoiceRecorder } from '../../../hooks/useVoiceRecorder';
import { useOfflinePhrasesStore } from '../../../stores/offlinePhrasesStore';
import { usePreferencesStore } from '../../../stores/preferencesStore';

type ClipboardLike = {
  clipboard?: {
    writeText: (text: string) => Promise<void>;
  };
};

const languageFlags: Partial<Record<LanguageCode, string>> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  ja: '🇯🇵',
  ko: '🇰🇷',
  vi: '🇻🇳',
  zh: '🇨🇳',
};

const initialMessages: readonly TranslationBubbleMessage[] = [
  {
    id: 'message-1-source',
    languageLabel: 'English',
    role: 'source',
    text: 'Hi, can you recommend a local breakfast spot near here?',
  },
  {
    flag: '🇻🇳',
    id: 'message-1-translation',
    languageLabel: 'Vietnamese',
    role: 'translation',
    text: 'Xin chao, ban co the goi y mot quan an sang dia phuong gan day khong?',
  },
  {
    id: 'message-2-source',
    languageLabel: 'English',
    role: 'source',
    text: 'Please make it not too spicy.',
  },
  {
    flag: '🇻🇳',
    id: 'message-2-translation',
    languageLabel: 'Vietnamese',
    role: 'translation',
    text: 'Lam on dung lam qua cay.',
  },
];

const getLanguageLabel = (language: LanguageCode): string =>
  SUPPORTED_LANGUAGES.find((item) => item.code === language)?.name ?? language.toUpperCase();

const mockTranslate = (text: string, targetLanguage: LanguageCode): string => {
  if (targetLanguage === 'vi') {
    return `Ban dich: ${text}`;
  }
  if (targetLanguage === 'en') {
    return `Translation: ${text}`;
  }
  return `${getLanguageLabel(targetLanguage)} translation: ${text}`;
};

const copyToClipboard = async (text: string): Promise<void> => {
  const maybeNavigator = (globalThis as typeof globalThis & { navigator?: ClipboardLike }).navigator;
  await maybeNavigator?.clipboard?.writeText(text);
};

export default function TranslateScreen(): JSX.Element {
  const preferredLanguage = usePreferencesStore((state) => state.preferredLanguage);
  const packs = useOfflinePhrasesStore((state) => state.packs);
  const recorder = useVoiceRecorder();
  const listRef = useRef<FlatList<TranslationBubbleMessage>>(null);
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('en');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(
    preferredLanguage === 'en' ? 'vi' : preferredLanguage,
  );
  const [messages, setMessages] = useState<readonly TranslationBubbleMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [phrasebookVisible, setPhrasebookVisible] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const swapRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const sourceLabel = useMemo(() => getLanguageLabel(sourceLanguage), [sourceLanguage]);
  const targetLabel = useMemo(() => getLanguageLabel(targetLanguage), [targetLanguage]);
  const offlinePhraseCount = packs.vn?.length ?? 0;

  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: !reducedMotion });
    }, 80);
    return () => clearTimeout(scrollTimer);
  }, [messages, reducedMotion]);

  useEffect(() => {
    if (recorder.recording && !reducedMotion) {
      pulseScale.value = withRepeat(withTiming(1.35, { duration: 720 }), -1, true);
      return;
    }

    cancelAnimation(pulseScale);
    pulseScale.value = withTiming(1, { duration: 160 });
  }, [pulseScale, recorder.recording, reducedMotion]);

  const swapStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swapRotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: recorder.recording ? 0.28 : 0,
    transform: [{ scale: pulseScale.value }],
  }));

  const appendTranslationPair = (text: string): void => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const timestamp = Date.now();
    const translatedText = mockTranslate(trimmed, targetLanguage);
    const nextMessages: readonly TranslationBubbleMessage[] = [
      {
        id: `message-${timestamp}-source`,
        languageLabel: sourceLabel,
        role: 'source',
        text: trimmed,
      },
      {
        flag: languageFlags[targetLanguage] ?? '🌐',
        id: `message-${timestamp}-translation`,
        languageLabel: targetLabel,
        role: 'translation',
        text: translatedText,
      },
    ];

    setMessages((current) => [...current, ...nextMessages]);
    setInputText('');
  };

  const swapLanguages = (): void => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    swapRotation.value = withTiming(swapRotation.value + 180, { duration: reducedMotion ? 0 : 260 });
  };

  const startVoiceInput = async (): Promise<void> => {
    await recorder.startRecording();
  };

  const stopVoiceInput = async (): Promise<void> => {
    await recorder.stopRecording();
    appendTranslationPair('Could you help me find the nearest pharmacy?');
  };

  const handleCopy = (message: TranslationBubbleMessage): void => {
    setCopiedMessageId(message.id);
    void copyToClipboard(message.text).catch(() => undefined);
    setTimeout(() => setCopiedMessageId(null), 1400);
  };

  const playMessage = (message: TranslationBubbleMessage): void => {
    setLastPlayedId(message.id);
    setTimeout(() => setLastPlayedId(null), 900);
  };

  const playPhrase = (phrase: PhrasebookPhrase): void => {
    setLastPlayedId(phrase.id);
    setTimeout(() => setLastPlayedId(null), 900);
  };

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <View className="flex-1 px-5 pb-4 pt-5">
        <View className="mb-5">
          <Text accessibilityLabel="Translate" className="font-inter-bold text-4xl text-white">
            Translate
          </Text>
          <Text className="mt-2 font-inter text-base text-zinc-300">
            A bilingual conversation space for the road.
          </Text>
        </View>

        <View className="mb-4 rounded-2xl border border-white/10 bg-white/10 p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-inter-bold text-lg text-white">Languages</Text>
            <TouchableOpacity
              accessibilityHint="Swaps source and target languages."
              accessibilityLabel="Swap translation languages"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full bg-primary"
              onPress={swapLanguages}
            >
              <Animated.View style={swapStyle}>
                <ArrowLeftRight color="#FFFFFF" size={20} />
              </Animated.View>
            </TouchableOpacity>
          </View>
          <Text className="mb-2 font-inter-semibold text-sm text-zinc-300">Source language</Text>
          <LanguagePicker value={sourceLanguage} onChange={setSourceLanguage} />
          <Text className="mb-2 mt-4 font-inter-semibold text-sm text-zinc-300">Target language</Text>
          <LanguagePicker value={targetLanguage} onChange={setTargetLanguage} />
        </View>

        <FlatList
          ref={listRef}
          accessibilityLabel="Translation conversation"
          className="flex-1"
          contentContainerClassName="pb-5"
          data={messages}
          inverted={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TranslationBubble
              copied={copiedMessageId === item.id}
              message={item}
              onCopy={handleCopy}
              onPlay={playMessage}
            />
          )}
        />

        <View className="rounded-3xl border border-white/10 bg-surface p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <TouchableOpacity
              accessibilityHint="Opens the quick offline phrasebook panel."
              accessibilityLabel="Open phrasebook"
              accessibilityRole="button"
              className="flex-row items-center gap-2 rounded-full bg-white/10 px-4 py-2"
              onPress={() => setPhrasebookVisible(true)}
            >
              <BookOpen color="#FFFFFF" size={18} />
              <Text className="font-inter-semibold text-sm text-white">Phrasebook</Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-2">
              <Text className="font-inter-semibold text-xs text-emerald-300">
                ✓ {offlinePhraseCount > 0 ? 'Available offline' : 'Offline ready'}
              </Text>
            </View>
          </View>

          <TextField
            accessibilityLabel="Translation input"
            className="min-h-24 text-top"
            multiline
            onChangeText={setInputText}
            placeholder="Type a message to translate..."
            value={inputText}
          />

          <View className="mt-3 flex-row items-center gap-3">
            <View className="relative h-14 w-14 items-center justify-center">
              <Animated.View
                className="absolute h-14 w-14 rounded-full bg-accent"
                pointerEvents="none"
                style={pulseStyle}
              />
              <TouchableOpacity
                accessibilityHint="Hold to record voice input, release to mock translate it."
                accessibilityLabel="Voice input microphone"
                accessibilityRole="button"
                accessibilityState={{ selected: recorder.recording }}
                className={`h-12 w-12 items-center justify-center rounded-full ${
                  recorder.recording ? 'bg-accent' : 'bg-white/10'
                }`}
                onPressIn={() => {
                  void startVoiceInput();
                }}
                onPressOut={() => {
                  void stopVoiceInput();
                }}
              >
                <Mic color="#FFFFFF" size={22} />
              </TouchableOpacity>
            </View>

            <PrimaryButton
              accessibilityHint="Adds a mock translated response to the conversation."
              className="flex-1"
              disabled={!inputText.trim()}
              icon={Send}
              label="Translate"
              onPress={() => appendTranslationPair(inputText)}
            />

            <TouchableOpacity
              accessibilityHint="Replays the most recent mock spoken translation."
              accessibilityLabel="Play latest translation"
              accessibilityRole="button"
              className={`h-12 w-12 items-center justify-center rounded-full ${
                lastPlayedId ? 'bg-primary' : 'bg-white/10'
              }`}
              onPress={() => {
                const latest = [...messages].reverse().find((message) => message.role === 'translation');
                if (latest) {
                  playMessage(latest);
                }
              }}
            >
              <Volume2 color={theme.colors.text} size={20} />
            </TouchableOpacity>
          </View>

          {recorder.error ? (
            <Text className="mt-2 font-inter-semibold text-xs text-accent">{recorder.error}</Text>
          ) : null}
        </View>
      </View>

      <PhrasebookSheet
        offlineAvailable
        onClose={() => setPhrasebookVisible(false)}
        onPlayPhrase={playPhrase}
        visible={phrasebookVisible}
      />
    </SafeAreaView>
  );
}
