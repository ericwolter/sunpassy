const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.ejs'
    }),
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      swDest: "sw.js",
      runtimeCaching: [{
        urlPattern: new RegExp('^https://maps\.googleapis\.com/'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      }, {
        urlPattern: new RegExp('^https://cdnjs\.cloudflare\.com/'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      }]
    }),
  ],
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    hot: true,
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
};