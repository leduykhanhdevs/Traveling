import { TextInput, type TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & {
  className?: string;
};

export const TextField = ({
  accessibilityLabel,
  className = '',
  placeholder,
  placeholderTextColor = '#A1A1AA',
  ...props
}: TextFieldProps): JSX.Element => (
  <TextInput
    accessibilityLabel={
      accessibilityLabel ?? (typeof placeholder === 'string' ? placeholder : 'Text input')
    }
    accessibilityHint="Enter text in this field."
    placeholderTextColor={placeholderTextColor}
    placeholder={placeholder}
    className={`min-h-12 rounded-lg border border-white/10 bg-white/10 px-4 py-3 font-inter text-base text-white ${className}`}
    {...props}
  />
);
