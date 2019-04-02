require('svelte/ssr/register')({
  extensions: ['.html']
})

import express from 'express'

const app = express()
const port = 3000

async function run () {
  try {
    app.set('view engine', 'hbs')

    app.use(express.static('public'))

    // DYNAMIC
    app.use('/', require('./pages/routes'))

    app.listen(port, () => console.log(`App listening on port ${port}!`))
  } catch (e) {
    console.error(e)
  }
}

run()

