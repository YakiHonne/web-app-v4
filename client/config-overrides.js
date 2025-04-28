// const webpack = require('webpack');

// module.exports = function override(config) {
//   const fallback = {
//     "crypto": require.resolve("crypto-browserify"),
//     "stream": require.resolve("stream-browserify"),
//     "http": require.resolve("stream-http"),
//     "https": require.resolve("https-browserify"),
//     "os": require.resolve("os-browserify/browser"),
//     "url": require.resolve("url/"),
//     "buffer": require.resolve("buffer/"),
//     "process": require.resolve("process/browser"),
//     "util": require.resolve("util/"),
//     "zlib": require.resolve("browserify-zlib"),
//   };

//   config.resolve.fallback = {
//     ...config.resolve.fallback,
//     ...fallback
//   };

//   config.plugins = [
//     ...config.plugins,
//     new webpack.ProvidePlugin({
//       Buffer: ['buffer', 'Buffer'],
//       process: 'process/browser'
//     })
//   ];

//   return config;
// }
const webpack = require("webpack");
module.exports = function override(config, env) {
  config.resolve.fallback = {
    buffer: false,
    crypto: false,
    events: false,
    path: false,
    stream: false,
    string_decoder: false,
  };
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    })
  );
  return config;
};
