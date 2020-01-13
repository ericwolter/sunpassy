const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest')

module.exports = {
  entry: './src/index.js',
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.ejs'
    }),
    new WebpackPwaManifest({
      name: 'sunpassy',
      short_name: 'sunpassy',
      description: 'sunpassy is a handy companion for your sun-infused travels.',
      background_color: '#faf7f5',
      theme_color: '#ffcc00',
      ios: true,
      icons: [
        {
          src: path.resolve('logo.png'),
          sizes: [96, 128, 192, 256, 384, 512, 1024] // multiple sizes
        }
      ]
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