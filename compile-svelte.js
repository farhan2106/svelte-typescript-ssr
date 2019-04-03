const glob = require('glob');
const fs = require('fs')
const uuid = require('uuid')
const arrToObj = require('array-to-object')

async function run () {
  /**
   * Add <script> tag into svelte component
   * This is because the <script> tag is built from typescript
   */
  const files = glob.sync(__dirname + '/src/**/*.html')
  await new Promise(function (resolve) {
    files.forEach(file => {
      let data = fs.readFileSync(file, 'utf8')
      data += '\r\n\r\n<script>\r\n'

      const svelteScriptTag = fs.readFileSync(file.replace('/src/', '/build/').replace('.html', '.js'), 'utf8')
      data += svelteScriptTag
      data += '</script>\r\n'

      fs.writeFileSync(file.replace('/src/', '/build/'), data, 'utf8')

      fs.unlinkSync(file.replace('/src/', '/build/').replace('.html', '.js'))
    })
    resolve()
  })

  /**
   * Build individual js file for client pages. For hydration
   */
  const builtFiles = glob.sync(__dirname + '/build/pages/**/*.html')
  fs.writeFileSync('./build/client.json', JSON.stringify(arrToObj(builtFiles.map(f => uuid.v4()), builtFiles)))
}

run()