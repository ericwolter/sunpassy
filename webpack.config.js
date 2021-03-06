const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');

module.exports = {
  entry: './src/index.js',
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.ejs',
      minify: {
        collapseWhitespace: false,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      }
    }),
    new WebpackPwaManifest({
      name: 'sunpassy',
      short_name: 'sunpassy',
      description: 'sunpassy is a handy companion for your sun-infused travels.',
      background_color: '#ffffff',
      theme_color: '#000000',
      ios: true,
      icons: [
        {
          src: path.resolve('./logo.png'),
          sizes: [192],
        },
        {
          src: path.resolve('./logo.png'),
          sizes: [120, 152, 167, 180, 1024], // multiple sizes
          ios: true
        }
      ]
    }),
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
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
      }, {
        urlPattern: new RegExp('^https://www\.googletagmanager\.com/'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      }, {
        urlPattern: new RegExp('^https://pagead2\.googlesyndication\.com/'),
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
    path: path.resolve(__dirname, '../dist/projects/sunpassy'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          'postcss-loader'
        ],
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      }
    ],
  },
};