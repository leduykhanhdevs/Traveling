const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Exclude .agents directories from being watched or bundled to prevent file-watching crashes
if (!config.resolver.blockList) {
  config.resolver.blockList = [];
}
if (Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList.push(/[\\/]\.agents[\\/]/);
} else {
  config.resolver.blockList = [config.resolver.blockList, /[\\/]\.agents[\\/]/];
}

module.exports = withNativeWind(config, { input: './global.css' });

