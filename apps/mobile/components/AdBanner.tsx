import React from 'react';
import { View, Text } from 'react-native';
import { useSubscriptionStore } from '../stores/subscriptionStore';

export function AdBanner() {
  const tier = useSubscriptionStore(state => state.tier);
  
  if (tier === 'premium') {
    return null;
  }
  
  return (
    <View className="w-full h-14 bg-zinc-800 items-center justify-center border-t border-white/10 mt-2">
      <Text className="font-inter text-xs text-zinc-400">AdBanner (Placeholder)</Text>
    </View>
  );
}
