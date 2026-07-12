declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: string;
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
    EXPO_PUBLIC_GOOGLE_MAPS_KEY?: string;
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
    EXPO_PUBLIC_POSTHOG_HOST?: string;
    EXPO_PUBLIC_POSTHOG_KEY?: string;
    EXPO_PUBLIC_REVENUECAT_APPLE_KEY?: string;
    EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY?: string;
    EXPO_PUBLIC_SENTRY_DSN?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
