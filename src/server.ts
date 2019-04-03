require('svelte/ssr/register')({
  extensions: ['.html']
})

import express from 'express'
const glob = require('glob');

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

    routePaths.forEach((p: string, index: number) => {
      app.get(`${p.toLowerCase()}`, (req: express.Request, res: express.Response) => {
        res.render('template', renderedTmpl[index])
      })
    })

    app.listen(port, () => console.log(`App listening on port ${port}!`))
  } catch (e) {
    console.error(e)
  }
}

run()

