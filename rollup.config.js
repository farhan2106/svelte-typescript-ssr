import svelte from 'rollup-plugin-svelte';
import typescript from 'rollup-plugin-typescript'
import postcss from 'rollup-plugin-postcss'
import { terser } from 'rollup-plugin-terser'
import packageJson from './package.json'

module.exports = {
  input: './build/client.js',
  output: {
    name: packageJson['name'],
    file: 'public/bundle.js',
    format: 'umd',
    sourcemap: true
  },
  plugins: [
    postcss({
      extensions: ['.css']
    }),
    typescript(),
    svelte({
      emitCss: false
    }),
    terser()
  ]
}
