const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const importFresh = require('import-fresh')

/**
 * Webpack is used to generate the client js files for hydration
 * Each route will have its own js to ensure that it only loads 
 * the minimum svelte component.
 */
module.exports = {
  entry: importFresh('./build/client.json'),
  mode: process.env.NODE_ENV || 'development',
  output: {
    libraryTarget: 'umd',
    library: 'page',
    path: path.resolve(__dirname, 'public')
  },
  module: {
    rules: [
      {
        test: /\.(html|svelte)$/,
        exclude: /node_modules/,
        use: {
          loader: 'svelte-loader',
          options: {
            emitCss: false,
            css: false,
            hydratable: true
          },
        },
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ]
};

