const path = require('path')
const { dest, src, watch, series } = require('gulp')
const ts = require('gulp-typescript')
const tap = require('gulp-tap')
const clean = require('gulp-clean')
const gls = require('gulp-live-server')
const fs = require('fs-extra')
const glob = require('glob')
const shortid = require('shortid')
const arrToObj = require('array-to-object')
const webpack = require('webpack')
const importFresh = require('import-fresh')
const chalk = require('chalk')
const cache = require('gulp-cached');

const tsProject = ts.createProject('tsconfig.json')

function copyTask () {
  return src([
    'src/ui/assets/**/**'
  ]).pipe(dest('build/ui/assets'))
}

function emptyDirs () {
  return src(['build', 'public'], { read: false, allowEmpty: true })
    .pipe(clean())
}

function scriptServer () {
  return src('src/server/**/*.ts')
    .pipe(cache('scriptServer'))
    .pipe(tsProject())
    .pipe(dest('build/server'))
}

function scriptUi () {
  return src('src/ui/**/*.ts')
    // .pipe(cache('scriptUi')) // buggy when enabled
    .pipe(tsProject())
    .pipe(tap(function (file) {
      const svelteHtmlPath = file.path.replace('build', 'src').replace('.js', '.svelte')
      const svelteStylePath = file.path.replace('build', 'src').replace('.js', '.scss')
      if (fs.existsSync(svelteHtmlPath)) {

        let styleData =  Buffer.from([])
        if (fs.existsSync(svelteStylePath)) {
          styleData = fs.readFileSync(svelteStylePath)
        }

        const bufferArr = [
          fs.readFileSync(svelteHtmlPath),
          Buffer.from(`\r\n\r\n<script>\r\n`),
          file.contents,
          Buffer.from(`</script>\r\n`),
          Buffer.from(`\r\n\r\n<style>\r\n`),
          styleData,
          Buffer.from(`</style>\r\n`),
        ]
        file.contents = Buffer.concat(bufferArr)
        file.path = file.path.replace('.js', '.svelte')
      }
    }))
    .pipe(dest('build/ui'))
}

function buildClientJs (cb) {
  const builtFiles = glob.sync(path.join(__dirname, '/src/ui/pages/**/*.svelte'))
  fs.outputFileSync(
    './build/client.json',
    JSON.stringify(
      arrToObj(
        builtFiles.map(() => shortid.generate()),
        builtFiles.map(f => f.replace('/src/', '/build/'))
      )
    )
  )
  cb()
}

function webpackTask (cb) {
  const configFile = process.env.NODE_ENV !== 'production' ? './webpack.config' : './webpack.prod.config'
  webpack(importFresh(configFile)).run((err, stats) => {
    if (err !== null) {
      console.error(chalk.red(err))
    }

    if (stats.hasErrors()) {
      console.error(chalk.red(stats.compilation.errors))
    }

    if (stats.hasWarnings()) {
      console.warn(chalk.yellow(stats.compilation.warnings))
    }
    cb()
  })
}

let server
function serve (cb) {
  if (!server) {
    server = gls.new(['build/server/main.js'])
    server.start()
  } else {
    server.stop()
    server.start()
  }
  cb()
}

const buildTasks = series(scriptUi, scriptServer, buildClientJs, webpackTask)

const developmentTasks = series(scriptUi, scriptServer, buildClientJs, webpackTask, serve)

if (process.env.NODE_ENV !== 'production') {
  watch(['views'], series(scriptServer, webpackTask, serve))
  watch(['src/server/**/*.ts'], series(scriptServer, webpackTask, serve))
  watch(['src/ui/**/*.{ts,scss,svelte}, !src/ui/assets/*.*'], series(scriptUi, buildClientJs, webpackTask, serve))
  watch(['src/ui/assets/*.*'], copyTask)
}
exports.default = process.env.NODE_ENV !== 'production' ? series(emptyDirs, copyTask, developmentTasks) : buildTasks
