require('svelte/ssr/register')({
  extensions: ['.html']
})
const fs = require('fs')
const svelte = require('svelte')
const express = require('express')
const app = express()
const port = 3000

async function run () {
  try {
    const tmpl = require('./App.html')
    console.log(tmpl)
    console.log(tmpl.render())

    app.use(express.static('public'))
    app.set('view engine', 'ejs')
    app.get('/', (req: any, res: any) => {
      // res.send(tmpl.render())
      res.render('layout', tmpl.render())
    })
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
  } catch (e) {
    console.error(e)
  }
}

run()

