# Svelte + Typescript + Storybook SSR Boilerplate

This is a __Svelte + Typescript + Storybook SSR__ boiletplate project.

## Writing Components

After that, the file-system is the main API. Every .js file becomes a route that gets automatically processed and rendered.

===

import express from 'express'
const router = express.Router()

const tmpl = require('./Index.html')

router.get('/', (req: express.Request, res: express.Response) => {
  res.render('template', tmpl.render())
})

module.exports = router

====

import Page from './Index.html'

document.addEventListener('DOMContentLoaded', () => {
  new Page({
    hydrate: true
  })
}, false);

====
