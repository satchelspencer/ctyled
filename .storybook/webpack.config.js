const webpack = require('webpack')
const path = require('path')

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"development"',
      'process.env.HOME': JSON.stringify(process.env.HOME),
      'process.env.NONODE': 'true',
      'process.env.STORYBOOK': 'true',
    }),
  ],
  module: {
    rules: [
      {
        test: /(\.ts|\.tsx)$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.html', '.ts', '.tsx', '.js', '.json'],
    alias: {
      lib: path.resolve(__dirname, '../src/lib'),
      plugin: path.resolve(__dirname, '../src/plugin/'),
      app: path.resolve(__dirname, '../src/app/'),
      src: path.resolve(__dirname, '../src/'),
    },
  },
}
