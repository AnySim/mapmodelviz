const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

const extractPlugin = new ExtractTextPlugin({ filename: '[name].css' });

module.exports = {
  entry: {
    app: './src/publish/index.js'
  },
  module: {
    rules: [
      { /* Javascript Babel */
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        // exclude: /node_modules/,
        exclude: [path.resolve(__dirname, 'node_modules') ,path.resolve(__dirname, 'src/components/settings'), path.resolve(__dirname, 'src/index.js')],
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }]
      },
      { /* HTML */
        test: /\.(html)$/,
        exclude: [path.resolve(__dirname, 'src/components/settings')],
        use: {
          loader: 'html-loader',
          options: {
            attrs: [':data-src']
          }
        }
      },
      { /* SASS */
        test: /\.(s*)css$/,
        include: [path.resolve(__dirname, 'src', 'style'), path.resolve(__dirname, 'node_modules', 'leaflet', 'dist')],
        use: extractPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
                url: false
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true
              }
            }
          ],
          fallback: 'style-loader'
        })
      }
    ]
  },
  resolve: {
    alias: {
      configsrc$: path.resolve(__dirname, './src/config.js')
    }
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      title: 'GeoSpatial Model Visualization',
      template: 'src/index.html'
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      Popper: ['popper.js', 'default'],
      config: ['configsrc', 'default'],
      Alert: "exports-loader?Alert!bootstrap/js/dist/alert",
      Button: "exports-loader?Button!bootstrap/js/dist/button",
      Collapse: "exports-loader?Collapse!bootstrap/js/dist/collapse",
      Dropdown: "exports-loader?Dropdown!bootstrap/js/dist/dropdown",
      Modal: "exports-loader?Modal!bootstrap/js/dist/modal",
      Util: "exports-loader?Util!bootstrap/js/dist/util",
   }),
   extractPlugin,
   new CopyWebpackPlugin([
      { from: './src/style/img/', to: 'img/' }
    ], {}),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
};
