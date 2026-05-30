import { SUPPORTED_LANGUAGES, type LanguageCode } from '@wanderai/shared';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

type LanguagePickerProps = {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
  includeAuto?: boolean;
};

export const LanguagePicker = ({
  value,
  onChange,
  includeAuto = false,
}: LanguagePickerProps): JSX.Element => {
  const languages = SUPPORTED_LANGUAGES.filter(
    (language) => includeAuto || language.code !== 'auto',
  );
  return (
    <ScrollView
      accessibilityLabel="Language picker"
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2"
    >
      {languages.map((language) => (
        <TouchableOpacity
          key={language.code}
          accessibilityHint={`Sets the selected language to ${language.name}.`}
          accessibilityLabel={`${language.name} language`}
          accessibilityRole="button"
          accessibilityState={{ selected: value === language.code }}
          className={`rounded-lg border px-3 py-2 ${
            value === language.code ? 'border-primary bg-primary' : 'border-white/10 bg-white/10'
          }`}
          onPress={() => onChange(language.code)}
        >
          <Text className="font-inter-semibold text-sm text-white">{language.name}</Text>
          <Text className="font-inter text-xs text-zinc-300">{language.nativeName}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
