import { Check, Copy, Volume2 } from 'lucide-react-native';
import { createElement, type PropsWithChildren } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  type TextProps,
  type TouchableOpacityProps,
  type ViewProps,
} from 'react-native';

export type TranslationBubbleMessage = {
  id: string;
  text: string;
  languageLabel: string;
  role: 'source' | 'translation';
  flag?: string;
};

type NativeWindClassNameProps = {
  className?: string;
};

type NativeWindViewProps = PropsWithChildren<ViewProps> & NativeWindClassNameProps;
type NativeWindTextProps = PropsWithChildren<TextProps> & NativeWindClassNameProps;
type NativeWindTouchableOpacityProps = PropsWithChildren<TouchableOpacityProps> &
  NativeWindClassNameProps;

type NativeWindViewComponent = (props: NativeWindViewProps) => JSX.Element;
type NativeWindTextComponent = (props: NativeWindTextProps) => JSX.Element;
type NativeWindTouchableOpacityComponent = (
  props: NativeWindTouchableOpacityProps,
) => JSX.Element;

const StyledView = (props: NativeWindViewProps): JSX.Element =>
  createElement(View as unknown as NativeWindViewComponent, props);

const StyledText = (props: NativeWindTextProps): JSX.Element =>
  createElement(Text as unknown as NativeWindTextComponent, props);

const StyledTouchableOpacity = (
  props: NativeWindTouchableOpacityProps,
): JSX.Element =>
  createElement(
    TouchableOpacity as unknown as NativeWindTouchableOpacityComponent,
    props,
  );

type TranslationBubbleProps = NativeWindViewProps & {
  copied: boolean;
  message: TranslationBubbleMessage;
  onCopy: (message: TranslationBubbleMessage) => void;
  onPlay: (message: TranslationBubbleMessage) => void;
};

export const TranslationBubble = ({
  className = '',
  copied,
  message,
  onCopy,
  onPlay,
  ...props
}: TranslationBubbleProps): JSX.Element => {
  const isSource = message.role === 'source';

  return (
    <StyledView
      className={`mb-3 max-w-[84%] ${isSource ? 'self-end' : 'self-start'} ${className}`}
      {...props}
    >
      <StyledTouchableOpacity
        accessibilityHint="Long press to copy this translation bubble."
        accessibilityLabel={`${isSource ? 'Original' : 'Translated'} message in ${message.languageLabel}: ${
          message.text
        }`}
        accessibilityRole="text"
        activeOpacity={0.9}
        className={`rounded-2xl px-4 py-3 ${isSource ? 'rounded-br-sm bg-primary' : 'rounded-bl-sm bg-white/90'}`}
        onLongPress={() => onCopy(message)}
      >
        <StyledText className={`font-inter text-base leading-6 ${isSource ? 'text-white' : 'text-slate-950'}`}>
          {!isSource && message.flag ? `${message.flag} ` : ''}
          {message.text}
        </StyledText>
        <StyledView className="mt-3 flex-row items-center justify-between gap-3">
          <StyledText className={`font-inter-semibold text-xs ${isSource ? 'text-white/70' : 'text-slate-500'}`}>
            {message.languageLabel}
          </StyledText>
          <StyledView className="flex-row items-center gap-2">
            {copied ? (
              <StyledView className="flex-row items-center gap-1">
                <Check color={isSource ? '#FFFFFF' : '#0f172a'} size={14} />
                <StyledText className={`font-inter-semibold text-xs ${isSource ? 'text-white' : 'text-slate-700'}`}>
                  Copied
                </StyledText>
              </StyledView>
            ) : (
              <Copy color={isSource ? '#FFFFFF' : '#0f172a'} size={14} />
            )}
            <StyledTouchableOpacity
              accessibilityHint="Plays this message aloud."
              accessibilityLabel={`Play ${isSource ? 'original' : 'translated'} message`}
              accessibilityRole="button"
              className={`h-8 w-8 items-center justify-center rounded-full ${
                isSource ? 'bg-white/15' : 'bg-slate-200'
              }`}
              onPress={() => onPlay(message)}
            >
              <Volume2 color={isSource ? '#FFFFFF' : '#0f172a'} size={16} />
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </StyledTouchableOpacity>
    </StyledView>
  );
};
