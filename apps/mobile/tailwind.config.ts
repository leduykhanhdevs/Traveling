import type { Config } from 'tailwindcss';
import nativewindPreset from 'nativewind/preset';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}'],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors: {
        accent: '#FF6584',
        background: '#0F0F1A',
        primary: '#6C63FF',
        surface: '#1A1A2E',
        success: '#2DD4BF',
        warning: '#FBBF24',
      },
      fontFamily: {
        inter: ['Inter_400Regular'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};

export default config;
