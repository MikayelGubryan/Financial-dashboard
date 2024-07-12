// next.config.js
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  webpack: (config, { isServer }) => {
    // Use mini-css-extract-plugin to extract CSS into separate files
    if (!isServer) {
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: 'styles/[name].css',
          chunkFilename: 'styles/[id].css',
        })
      );
      config.module.rules.push({
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      });
    }

    return config;
  },
};
