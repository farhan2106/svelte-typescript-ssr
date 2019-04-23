const { dest, watch, src, series } = require('gulp')
const fs = require('fs')
const glob = require('glob')
const shortid = require('shortid')
const arrToObj = require('array-to-object')
const ts = require('gulp-typescript')

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

function buildClientJs (cb) {
  const builtFiles = glob.sync(__dirname + '/src/pages/**/*.html')
  fs.writeFileSync('./build/client.json', JSON.stringify(arrToObj(builtFiles.map(f => shortid.generate()), builtFiles)))
  cb()
}

watch(['src/**/*.ts'], series(clean, buildTs, buildClientJs));
exports.buildTs = buildTs;
exports.default = series(clean, buildTs, buildClientJs);