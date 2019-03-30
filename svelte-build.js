const glob = require('glob');
const fs = require('fs')

glob(__dirname + '/src/**/*.svelte', {}, (err, files)=>{
  files.forEach(file => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        return console.log(err)
      }
  
      data += '\r\n\r\n<script>\r\n'
      fs.readFile(file.replace('/src/', '/build/').replace('.svelte', '.js'), 'utf8', (err, svelteScriptTag) => {
        if (err) return console.log(err)

        data += svelteScriptTag
        data += '</script>\r\n'
        fs.writeFile(file.replace('/src/', '/build/'), data, 'utf8', err => {
           if (err) return console.log(err)
           fs.unlink(file.replace('/src/', '/build/').replace('.svelte', '.js'), () => {})
        })
      })
    })
  })
})
