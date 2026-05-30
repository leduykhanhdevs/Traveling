import { View } from 'react-native';

export const Skeleton = ({ className = 'h-20' }: { className?: string }): JSX.Element => (
  <View
    accessibilityLabel="Loading content"
    accessibilityRole="progressbar"
    className={`overflow-hidden rounded-lg bg-white/10 ${className}`}
  >
    <View className="h-full w-1/3 bg-white/10" />
  </View>
);
