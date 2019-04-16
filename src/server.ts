require('svelte/ssr/register')({
  extensions: ['.html']
})

import express from 'express'
const reload = require('reload')
const bodyParser = require('body-parser')
const glob = require('glob')
const clientJson = require('./../build/client.json')

const app = express()

async function run () {
  try {
    app.set('port', process.env.PORT || 8080)
    app.set('httpsPort', process.env.HTTPS_PORT || 8181)
    app.set('env', process.env.NODE_ENV || 'development')
    app.set('view engine', 'hbs')

    app.use(bodyParser.json()); // for parsing application/json
    app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
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
          devMode: app.get('env') === 'development',
          sveltePageJs: `/${clientJsFileName}.js`,
          ...renderedTmpl[index]
        })
      })
    })

    const serverStart = () => {
      app.listen(app.get('port'), () => {
        console.log(`\r\nApp (http) listening on port ${app.get('port')}`)
      })
    }

    if (app.get('env') === 'development') {
      reload(app)
        .then(serverStart)
        .catch((err: Error) => {
          console.error('Reload could not start, could not start app', err)
        })
    } else {
      serverStart()
    }
  } catch (e) {
    console.error(e)
  }
}

run()

