import { Text, TouchableOpacity, View } from 'react-native';

type SegmentedControlProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>): JSX.Element => (
  <View
    accessibilityLabel="Segmented control"
    accessibilityRole="adjustable"
    className="flex-row rounded-lg border border-white/10 bg-white/10 p-1"
  >
    {options.map((option) => (
      <TouchableOpacity
        key={option}
        accessibilityHint={`Switches to ${option} mode.`}
        accessibilityLabel={`${option} option`}
        accessibilityRole="button"
        accessibilityState={{ selected: option === value }}
        className={`flex-1 rounded-md px-2 py-2 ${option === value ? 'bg-primary' : ''}`}
        onPress={() => onChange(option)}
      >
        <Text className="text-center font-inter-semibold text-sm text-white">{option}</Text>
      </TouchableOpacity>
    ))}
  </View>
);
