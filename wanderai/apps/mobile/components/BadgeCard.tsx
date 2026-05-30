import { Lock } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { GlassCard } from './GlassCard';

export type TravelerBadge = {
  id: string;
  icon: string;
  name: string;
  description: string;
  earned: boolean;
};

type BadgeCardProps = {
  badge: TravelerBadge;
};

export const BadgeCard = ({ badge }: BadgeCardProps): JSX.Element => (
  <GlassCard className={`mr-3 w-40 ${badge.earned ? '' : 'opacity-50'}`}>
    <View accessibilityLabel={`${badge.name} badge. ${badge.earned ? 'Earned' : 'Locked'}.`}>
      <View className="relative mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
        <Text className="text-3xl">{badge.icon}</Text>
        {!badge.earned ? (
          <View className="absolute inset-0 items-center justify-center rounded-2xl bg-black/50">
            <Lock color="#ffffff" size={18} />
          </View>
        ) : null}
      </View>
      <Text className="font-inter-bold text-base text-white" numberOfLines={1}>
        {badge.name}
      </Text>
      <Text className="mt-2 font-inter text-xs leading-4 text-zinc-300" numberOfLines={2}>
        {badge.description}
      </Text>
    </View>
  </GlassCard>
);
