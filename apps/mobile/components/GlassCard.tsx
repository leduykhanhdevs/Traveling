import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

type GlassCardProps = PropsWithChildren<ViewProps> & {
  className?: string;
};

export const GlassCard = ({ children, className = '', ...props }: GlassCardProps): JSX.Element => (
  <BlurView
    intensity={30}
    tint="dark"
    className={`overflow-hidden rounded-lg border border-white/10 ${className}`}
  >
    <View className="bg-white/10 p-4" {...props}>
      {children}
    </View>
  </BlurView>
);
