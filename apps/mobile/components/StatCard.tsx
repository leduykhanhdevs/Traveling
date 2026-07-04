import { Text, View } from 'react-native';
import { GlassCard } from './GlassCard';

type StatCardProps = {
  label: string;
  value: number;
  emoji: string;
};

export const StatCard = ({ label, value, emoji }: StatCardProps): JSX.Element => (
  <GlassCard className="flex-1">
    <View accessibilityLabel={`${label}: ${value}`} className="items-center">
      <Text className="text-2xl">{emoji}</Text>
      <Text className="mt-2 font-inter-bold text-2xl text-white">{value}</Text>
      <Text className="mt-1 text-center font-inter text-xs text-zinc-400">{label}</Text>
    </View>
  </GlassCard>
);
