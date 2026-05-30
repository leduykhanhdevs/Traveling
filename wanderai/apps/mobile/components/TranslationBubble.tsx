import { Check, Copy, Volume2 } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

export type TranslationBubbleMessage = {
  id: string;
  text: string;
  languageLabel: string;
  role: 'source' | 'translation';
  flag?: string;
};

type TranslationBubbleProps = {
  copied: boolean;
  message: TranslationBubbleMessage;
  onCopy: (message: TranslationBubbleMessage) => void;
  onPlay: (message: TranslationBubbleMessage) => void;
};

export const TranslationBubble = ({
  copied,
  message,
  onCopy,
  onPlay,
}: TranslationBubbleProps): JSX.Element => {
  const isSource = message.role === 'source';

  return (
    <View className={`mb-3 max-w-[84%] ${isSource ? 'self-end' : 'self-start'}`}>
      <TouchableOpacity
        accessibilityHint="Long press to copy this translation bubble."
        accessibilityLabel={`${isSource ? 'Original' : 'Translated'} message in ${message.languageLabel}: ${
          message.text
        }`}
        accessibilityRole="text"
        activeOpacity={0.9}
        className={`rounded-2xl px-4 py-3 ${isSource ? 'rounded-br-sm bg-primary' : 'rounded-bl-sm bg-white/90'}`}
        onLongPress={() => onCopy(message)}
      >
        <Text className={`font-inter text-base leading-6 ${isSource ? 'text-white' : 'text-slate-950'}`}>
          {!isSource && message.flag ? `${message.flag} ` : ''}
          {message.text}
        </Text>
        <View className="mt-3 flex-row items-center justify-between gap-3">
          <Text className={`font-inter-semibold text-xs ${isSource ? 'text-white/70' : 'text-slate-500'}`}>
            {message.languageLabel}
          </Text>
          <View className="flex-row items-center gap-2">
            {copied ? (
              <View className="flex-row items-center gap-1">
                <Check color={isSource ? '#FFFFFF' : '#0f172a'} size={14} />
                <Text className={`font-inter-semibold text-xs ${isSource ? 'text-white' : 'text-slate-700'}`}>
                  Copied
                </Text>
              </View>
            ) : (
              <Copy color={isSource ? '#FFFFFF' : '#0f172a'} size={14} />
            )}
            <TouchableOpacity
              accessibilityHint="Plays this message aloud."
              accessibilityLabel={`Play ${isSource ? 'original' : 'translated'} message`}
              accessibilityRole="button"
              className={`h-8 w-8 items-center justify-center rounded-full ${
                isSource ? 'bg-white/15' : 'bg-slate-200'
              }`}
              onPress={() => onPlay(message)}
            >
              <Volume2 color={isSource ? '#FFFFFF' : '#0f172a'} size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};
