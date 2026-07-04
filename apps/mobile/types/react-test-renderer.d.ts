// Minimal ambient declaration for react-test-renderer.
//
// react-test-renderer@19 does not bundle its own types and the DefinitelyTyped
// package (@types/react-test-renderer) is deprecated for React 19 and forces an
// incompatible peer dependency. We only use `create`, `act`, `update`, and
// `unmount` in tests, so we declare just that surface here.
declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  export interface ReactTestRenderer {
    update(element: ReactElement): void;
    unmount(): void;
    toJSON(): unknown;
  }

  export function create(element: ReactElement): ReactTestRenderer;
  export function act(callback: () => void | Promise<void>): void | Promise<void>;

  const TestRenderer: {
    create: typeof create;
    act: typeof act;
  };
  export default TestRenderer;
}