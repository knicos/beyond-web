const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const webpack = require('webpack');

const ASSET_PATH = process.env.ASSET_PATH || '/';

module.exports = {
  context: process.cwd(),
  mode: 'production',
  target: 'web',
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{loader: 'ts-loader', options: { transpileOnly: false }}],
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new CompressionPlugin(),
    new HtmlWebpackPlugin({
      title: 'FT-Lab',
    }),
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),

    new webpack.DefinePlugin({
        'process.env.ASSET_PATH': JSON.stringify(process.env.ASSET_PATH || '/'),
        'process.env.CLIENT_ID': JSON.stringify(process.env.CLIENT_ID || '614d906bf0d4d418b719b9a8'),
        'process.env.CLIENT_SECRET': JSON.stringify(process.env.CLIENT_SECRET || 'none')
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
        assert: false,
        util: require.resolve('./src/lib/util'),
    }
  },
  output: {
    filename: '[contenthash].bundle.js',
    path: path.resolve(__dirname, 'dist'),
	clean: true,
    publicPath: ASSET_PATH,
  },
};
