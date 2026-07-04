module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    // react-native-worklets/plugin is required by react-native-reanimated 4.x
    // and must be listed last.
    plugins: ['react-native-worklets/plugin'],
  };
};
