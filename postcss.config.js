const path = require('path')

const plugins = [
  require('postcss-import')({
    path: [
      path.join(__dirname, '/src')
    ]
  }),
  require('autoprefixer')(),
  require('postcss-preset-env')()
]

if (process.env.NODE_ENV === 'production') {
  plugins.push(require('cssnano')({
    preset: 'default',
  }));
}

module.exports = {
  plugins
}
