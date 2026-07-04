// Define the React Native `__DEV__` global before any module loads.
// babel-preset-expo wires JSX through react-native-css-interop, which imports
// react-native at module load time and expects `__DEV__` to exist.
(globalThis as { __DEV__?: boolean }).__DEV__ = true;

// react-test-renderer requires this flag to enable `act(...)` support.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;