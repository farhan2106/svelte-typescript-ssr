const webpack = require('webpack')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const importFresh = require('import-fresh')
const sass = require('node-sass')
const postcss = require('postcss')

const mode = process.env.NODE_ENV || 'development'
const prod = mode === 'production'

/**
 * Webpack is used to generate the client js files for hydration
 * Each route will have its own js to ensure that it only loads
 * the minimum svelte component.
 */
module.exports = {
  entry: Object.assign({ 'bulma': './build/ui/assets/main.scss' }, importFresh('./build/client.json')),
  mode: process.env.NODE_ENV || 'development',
  output: {
    libraryTarget: 'umd',
    library: 'page',
    path: path.resolve(__dirname, 'public')
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss)$/,
        use: [
          prod ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(html|svelte)$/,
        exclude: /node_modules/,
        use: {
          loader: 'svelte-loader',
          options: {
            preprocess: {
              style: async (input) => {
                const postCssOpts = {
                  from: input.filename.replace(__dirname, '').replace('.html', '.css'),
                  to: input.filename.replace(__dirname, '').replace('/build/', '/src/')
                }
                let result = sass.renderSync({
                  data: input.content
                })
                result = await postcss(require('./postcss.config')).process(result.css.toString(), postCssOpts)
                return {
                  code: result.css.toString()
                }
              }
            },
            emitCss: false,
            css: false,
            hydratable: true
          }
        }
      }
    ]
  },
  mode,
  devtool: prod ? false : 'source-map',
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    })
  ]
}
