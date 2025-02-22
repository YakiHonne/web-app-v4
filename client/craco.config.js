const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "https": require.resolve("https-browserify"),
          "http": require.resolve("stream-http"),
          "stream": require.resolve("stream-browserify"),
          "crypto": require.resolve("crypto-browserify"),
          "buffer": require.resolve("buffer/"),
          "zlib": require.resolve("browserify-zlib"),
        }
      },
      plugins: [
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
      ]
    }
  }
};