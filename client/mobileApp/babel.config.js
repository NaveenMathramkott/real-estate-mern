// Expo SDK 57 auto-configures Metro's TypeScript path aliases from tsconfig.json,
// so no resolver plugin is needed here — `babel-preset-expo` also pulls in the
// worklets/reanimated plugin automatically when those packages are installed.
module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
  };
};
