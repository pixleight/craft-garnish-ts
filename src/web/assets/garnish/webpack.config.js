/* jshint esversion: 6 */
/* globals module, require, __dirname */
const {getConfig} = require('@craftcms/webpack');
const {join} = require('path');

module.exports = getConfig({
  context: __dirname,
  watchPaths: [join(__dirname, 'src')],
  config: {
    entry: {
      garnish: './index.ts',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: require.resolve('./src/index.ts'),
          loader: 'expose-loader',
          options: {
            exposes: [
              {
                globalName: 'Garnish',
                moduleLocalName: 'default',
              },
            ],
          },
        },
      ],
    },
  },
});
