require('svelte/ssr/register')({
  extensions: ['.svelte'],
  format: 'umd'
})
const fs = require('fs')
const svelte = require('svelte')
const express = require('express')
const app = express()
const port = 3000

async function run () {
  try {
    const tmpl = require('./App.svelte')

    app.set('view engine', 'pug')
    app.get('/', (req: any, res: any) => {
      res.send(tmpl.render())
    })
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
  } catch (e) {
    console.error(e)
  }
}

run()

