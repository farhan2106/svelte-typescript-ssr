import express from 'express'
import NavBar from './../components/NavBar/NavBar.html';

const tmpl = require('./Index.html')

export const routeHandler = function () {
  return (req: express.Request, res: express.Response) => {
    res.render('template', tmpl.render())
  }
}

export default {
    components: {
        NavBar
    }
};
