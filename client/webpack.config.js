// module.exports = {
//     resolve: {
//       fallback: {
//         "https": require.resolve("https-browserify"),
//         "http": require.resolve("stream-http"),
//         "stream": require.resolve("stream-browserify"),
//         "crypto": require.resolve("crypto-browserify"),
//         "zlib": require.resolve("browserify-zlib"),
//         "buffer": require.resolve("buffer/"),
//       }
//     },
//     plugins: [
//       new webpack.ProvidePlugin({
//         Buffer: ['buffer', 'Buffer'],
//       }),
//     ]
//   }

module.exports = [
  {
      plugins: [
      new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
      }),
      ],
      resolve: {
      fallback: {
          buffer: false,
          crypto: false,
          events: false,
          path: false,
          stream: false,
          string_decoder: false,
      },
      },
  },
  ];
  