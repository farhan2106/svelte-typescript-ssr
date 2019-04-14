const path = require('path')

/**
 * Webpack is used to generate the client js files for hydration
 * Each route will have its own js to ensure that it only loads 
 * the minimum svelte component.
 */
module.exports = {
  entry: require('./build/client.json'),
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
          },
        },
      }
    ]
  }
};

