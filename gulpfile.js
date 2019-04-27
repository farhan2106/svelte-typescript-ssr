const { dest, src, watch, series, lastRun, parallel } = require('gulp')
const ts = require('gulp-typescript')
const tap = require('gulp-tap')
const clean = require('gulp-clean')
const gls = require('gulp-live-server')
const fs = require('fs-extra')
const glob = require('glob')
const shortid = require('shortid')
const arrToObj = require('array-to-object')
const stylus = require('gulp-stylus')
const postcss = require("gulp-postcss")
const atImport = require("postcss-import")
const webpack = require('webpack')
const importFresh = require('import-fresh')

const tsProject = ts.createProject('tsconfig.json')

function emptyDirs () {
  return src(['build', 'public'], { read: false, allowEmpty: true })
          .pipe(clean())
}

function scriptSvelte () {
  return src('src/**/*.ts', { since: lastRun(scriptSvelte) })
    .pipe(tsProject())
    .pipe(tap(function(file) {
      const svelteHtmlPath = file.path.replace('build', 'src').replace('.js', '.html')
      if (fs.existsSync(svelteHtmlPath)) {
        const bufferArr = [
          fs.readFileSync(svelteHtmlPath),
          Buffer.from(`\r\n\r\n<script>\r\n`),
          file.contents,
          Buffer.from(`</script>\r\n`),
        ]
        file.contents = Buffer.concat(bufferArr);
        file.path = file.path.replace('.js', '.html')
      }
    }))
    .pipe(dest('build'))
}

function styleSvelte () {
  return src('src/**/*.styl', { since: lastRun(styleSvelte) })
    .pipe(stylus())
    .pipe(postcss([
      atImport({ path: __dirname + '/src' })
    ]))
    .pipe(tap(function(file) {
      const svelteHtmlPath = file.path.replace('.css', '.html')
      if (fs.existsSync(svelteHtmlPath)) {
        const bufferArr = [
          Buffer.from(`\r\n\r\n<style>\r\n`),
          file.contents,
          Buffer.from(`</style>\r\n`),
        ]
        file.contents = Buffer.concat(bufferArr);
        file.path = svelteHtmlPath
      }
    }))
    .pipe(dest('build', { overwrite: true, append: true }))
}

function buildClientJs (cb) {
  const builtFiles = glob.sync(__dirname + '/src/pages/**/*.html')
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
  webpack(importFresh('./webpack.config')).run(cb);
}

function serve (cb) {
  const server = gls.new(['--harmony', 'build/main.js'])
  server.start();
  watch(['build', 'public'], () => {
    server.stop()
    server.start()
  })
  cb()
}

const buildTasks = series(scriptSvelte, styleSvelte, buildClientJs, webpackTask)

const developmentTasks = series(
  emptyDirs, 
  series(scriptSvelte, styleSvelte, buildClientJs, webpackTask, serve)
)

process.env.NODE_ENV !== 'production' && watch(['src/**/*.*'], buildTasks)
exports.default = process.env.NODE_ENV !== 'production' ? developmentTasks : buildTasks
