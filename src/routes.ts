const glob = require('glob');
const fs = require('fs')

glob(__dirname + '/pages/**/*.html', {}, (err: any, files: any) => {
  console.log(files)
})