require('svelte/ssr/register')({
  extensions: ['.html']
})

import express from 'express'
import { runInContext } from 'vm';
const glob = require('glob');
const clientJson = require('./../build/client.json')

const app = express()
const port = 3000

async function run () {
  try {
    app.set('view engine', 'hbs')

    app.use(express.static('public'))

    // get pages path
    const routePaths: string[] = await new Promise(function (resolve, reject) {
      glob(__dirname + '/pages/**/*.html', {}, (err: Error, files: string[]) => {
        // 1. generate list of route path
        return resolve(
          files.map(f => 
            '/' + f.substring(
              f.indexOf('pages/')
            ).replace('pages/', '').replace('.html', '')
          )
        )
      })
    })

    // Render templates 
    const renderedTmpl = routePaths.map((p: string) => {
      const tmpl = require(`./pages/${p}.html`)
      return tmpl.render()
    })

    console.log('\r')
    routePaths.forEach((p: string, index: number) => {

      // find the javascript file for the client based on route
      let clientJsFileName: string
      for (const index in clientJson) {
        if (clientJson[index] ===`${__dirname}/pages${p}.html`) {
          clientJsFileName = index
        }
      }

      // It assumes /Index as /
      let routePath = p.replace('/Index', '').toLowerCase()
      routePath = routePath === '' ? '/' : routePath

      // route handler for the pages
      console.log(`Route handler: ${routePath} initialized.`)
      app.get(`${routePath}`, (req: express.Request, res: express.Response) => {
        res.render('template', {
          sveltePageJs: `/${clientJsFileName}.js`,
          ...renderedTmpl[index]
        })
      })
    })

    app.listen(port, () => console.log(`\r\nApp listening on port ${port}`))
  } catch (e) {
    console.error(e)
  }
}

run()

