const { dest, watch, src, series } = require('gulp')
const ts = require('gulp-typescript')
const tap = require('gulp-tap')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const shortid = require('shortid')
const arrToObj = require('array-to-object')

const tsProject = ts.createProject('tsconfig.json')

function clean (cb) {
  // body omitted
  cb();
}

function buildTs () {
  return src('src/**/*.ts')
    .pipe(tsProject())
    .pipe(dest('build'))
}

function buildHtml () {
  return src('src/**/*.html')
    .pipe(dest('build'))
}

function mergeSvelte () {
  return src('src/**/*.ts')
    .pipe(tsProject())
    .pipe(tap(function(file) {
      const svelteHtmlPath = file.path.replace('build', 'src').replace('.js', '.html')
      if (fs.existsSync(svelteHtmlPath)) {
        file.contents = Buffer.concat([
          fs.readFileSync(svelteHtmlPath),
          Buffer.from(`\r\n\r\n<script>\r\n`),
          file.contents,
          Buffer.from(`</script>\r\n`)
        ]);
        file.path = file.path.replace('.js', '.html')
      }
    }))
    .pipe(dest('build'))
}

function buildClientJs (cb) {
  const builtFiles = glob.sync(__dirname + '/build/pages/**/*.html')
  fs.writeFileSync('./build/client.json', JSON.stringify(arrToObj(builtFiles.map(f => shortid.generate()), builtFiles)))
  cb()
}

watch(['src/**/*.ts'], series(clean, buildTs, buildHtml, buildClientJs));
exports.mergeSvelte = series(clean, mergeSvelte, buildClientJs);
exports.default = series(clean, buildTs, buildHtml, buildClientJs);