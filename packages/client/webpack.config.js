const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const ASSET_PATH = process.env.ASSET_PATH || '/';

module.exports = {
  context: process.cwd(),
  devtool: "source-map",
  mode: 'development',
  target: 'web',
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{loader: 'ts-loader', options: { transpileOnly: false }}],
        exclude: /node_modules/,
      },
    ],
  },
  devServer: {
    contentBase: './dist',
    port: 3000,
    compress: true,
    proxy: {
        '/v1': 'http://localhost:8080',
      },
  },
  plugins: [
	new HtmlWebpackPlugin({
	  title: 'FT-Lab',
	}),
    
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),

    new webpack.DefinePlugin({
        'process.env.ASSET_PATH': JSON.stringify(process.env.ASSET_PATH || '/'),
        'process.env.CLIENT_ID': JSON.stringify(process.env.CLIENT_ID),
        'process.env.CLIENT_SECRET': JSON.stringify(process.env.CLIENT_SECRET)
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
  optimization: {
    runtimeChunk: true,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
};
