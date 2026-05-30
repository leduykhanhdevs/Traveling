import type { ScoreBreakdown as ScoreBreakdownType } from '@wanderai/shared';
import { Text, View } from 'react-native';

const scoreRows = (score: ScoreBreakdownType): readonly { label: string; value: number }[] => [
  { label: 'Google', value: score.googleRatingScore },
  { label: 'Volume', value: score.reviewVolumeScore },
  { label: 'Social', value: score.socialProofScore },
];

export const ScoreBreakdown = ({ score }: { score: ScoreBreakdownType }): JSX.Element => (
  <View
    accessibilityLabel={`Score breakdown. Google ${score.googleRatingScore}. Volume ${score.reviewVolumeScore}. Social ${score.socialProofScore}.`}
    className="gap-2"
  >
    {scoreRows(score).map((row) => (
      <View key={row.label} className="gap-1">
        <View className="flex-row justify-between">
          <Text className="font-inter text-xs text-zinc-300">{row.label}</Text>
          <Text className="font-inter-semibold text-xs text-white">{row.value}</Text>
        </View>
        <View className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <View className="h-full rounded-full bg-accent" style={{ width: `${row.value}%` }} />
        </View>
      </View>
    ))}
  </View>
);
