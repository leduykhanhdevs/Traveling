// Lightweight renderHook helper built on react-test-renderer.
//
// The official @testing-library/react-native and jest-expo presets boot the
// native React Native runtime (`__DEV__`, `__fbBatchedBridgeConfig`), which is
// unavailable in the node test environment. These hook tests only exercise
// state and functions (no RN components render), so this minimal helper renders
// through react-test-renderer without importing react-native.
import { createElement, type ReactNode } from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';

export { act };

export type RenderHookResult<TResult> = {
  result: { current: TResult };
  rerender: (props?: unknown) => void;
  unmount: () => void;
};

export const renderHook = <TResult>(callback: () => TResult): RenderHookResult<TResult> => {
  const result = { current: undefined as unknown as TResult };

  const HookHarness = (): ReactNode => {
    result.current = callback();
    return null;
  };

  let renderer: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(createElement(HookHarness));
  });

  return {
    result,
    rerender: () => {
      act(() => {
        renderer.update(createElement(HookHarness));
      });
    },
    unmount: () => {
      act(() => {
        renderer.unmount();
      });
    },
  };
};