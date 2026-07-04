type AnalyticsPayload = Record<string, string | number | boolean | null>;

export const trackEvent = async (
  eventName: string,
  payload: AnalyticsPayload = {},
): Promise<void> => {
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!host || !key) {
    return;
  }

  try {
    await fetch(`${host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        api_key: key,
        event: eventName,
        properties: payload,
      }),
    });
  } catch {
    // Analytics must never block core travel workflows.
  }
};
