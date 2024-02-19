const { rmSync, mkdirSync, existsSync, readFileSync } = require('fs')
const { join } = require('path')

const gulp = require('gulp')
const rename = require('gulp-rename')

const packages = ['body', 'cookie', 'core', 'cors', 'router', 'send', 'static']

function clean() {
  if (existsSync('./dist')) {
    rmSync('./dist', { recursive: true })
  }
  mkdirSync('./dist')
}

function getEntryFile(module) {
  const pkg = JSON.parse(readFileSync(`../${module}/package.json`))

  return join(`../${module}`, pkg.main)
}

function build(module) {
  const src = getEntryFile(module)

  return gulp
    .src(src)
    .pipe(rename(`${module}.js`))
    .pipe(gulp.dest(`./dist`))
}

function defaultTask(cb) {
  clean()

  packages.map(build)

  cb()
}

exports.default = defaultTask
