import { act, renderHook } from '@testing-library/react-hooks';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Haptics from 'expo-haptics';
import { useHapticAction } from '../hooks/useHapticAction';

describe('useHapticAction', () => {
  const impactMock = jest.mocked(Haptics.impactAsync);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs medium haptic feedback by default', async () => {
    impactMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useHapticAction());

    await act(async () => {
      await result.current();
    });

    expect(impactMock).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('runs a custom haptic feedback style', async () => {
    impactMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useHapticAction());

    await act(async () => {
      await result.current(Haptics.ImpactFeedbackStyle.Light);
    });

    expect(impactMock).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('swallows haptic errors so primary actions can continue', async () => {
    impactMock.mockRejectedValue(new Error('Haptics unavailable'));
    const { result } = renderHook(() => useHapticAction());

    await expect(result.current()).resolves.toBeUndefined();
    expect(impactMock).toHaveBeenCalledTimes(1);
  });
});
