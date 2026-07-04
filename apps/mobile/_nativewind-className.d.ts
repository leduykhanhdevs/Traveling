// Local NativeWind className augmentation.
//
// NativeWind ships className typings via `react-native-css-interop/types`, but
// in this monorepo those packages are hoisted to the workspace root and resolve
// against the root `react-native` copy instead of this app's `react-native`
// version, so the upstream augmentation never merges. We re-declare it here
// against the app's own `react-native` instance.
//
// The leading underscore keeps this file first in TypeScript's processing order
// so the augmentation merges before the hoisted css-interop types load.
import 'react-native';

declare module 'react-native' {
  interface ViewProps { className?: string; }
  interface TextProps { className?: string; }
  interface TextInputProps { className?: string; placeholderClassName?: string; }
  interface ImageProps { className?: string; }
  interface ImagePropsBase { className?: string; }
  interface ScrollViewProps { className?: string; contentContainerClassName?: string; }
  interface SwitchProps { className?: string; }
  interface TouchableWithoutFeedbackProps { className?: string; }
}
