const { dest, src, watch, series } = require('gulp')
const ts = require('gulp-typescript')
const tap = require('gulp-tap')
const clean = require('gulp-clean')
const gls = require('gulp-live-server')
const fs = require('fs-extra')
const glob = require('glob')
const shortid = require('shortid')
const arrToObj = require('array-to-object')
const sass = require('gulp-sass')
const postcss = require("gulp-postcss")
const atImport = require("postcss-import")
const webpack = require('webpack')
const importFresh = require('import-fresh')
const chalk = require('chalk')

const svelteTsProject = ts.createProject('tsconfig.ui.json')

const serverTsProject = ts.createProject('tsconfig.server.json')

function emptyDirs () {
  return src(['build', 'public'], { read: false, allowEmpty: true })
          .pipe(clean())
}

function scriptServer () {
  return src('src/server/**/*.ts')
    .pipe(serverTsProject())
    .pipe(dest('build/server'))
}

function scriptSvelte () {
  return src('src/ui/**/*.ts')
    .pipe(svelteTsProject())
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
    .pipe(dest('build/ui'))
}

function styleSvelte () {
  return src('src/**/*.scss')
    .pipe(sass())
    .pipe(postcss([
      atImport({
        path: [
          __dirname + '/src',
        ]
      })
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
  const builtFiles = glob.sync(__dirname + '/src/ui/pages/**/*.html')
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
  webpack(importFresh('./webpack.config')).run((err, stats) => {
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
  });
}

let server = undefined
function serve (cb) {
  if (!server) {
    server = gls.new(['--harmony', 'build/server/server.js'])
    server.start()
  } else {
    server.stop()
    server.start()
  }
  cb()
}

const buildTasks = series(scriptSvelte, scriptServer, styleSvelte, buildClientJs, webpackTask)

const developmentTasks = series(
  emptyDirs, 
  series(scriptSvelte, scriptServer, styleSvelte, buildClientJs, webpackTask, serve)
)

process.env.NODE_ENV !== 'production' && watch(['src/**/*.*', 'views'], developmentTasks)
exports.default = process.env.NODE_ENV !== 'production' ? developmentTasks : buildTasks
