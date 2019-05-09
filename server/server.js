// const express = require("express");
import express from 'express'
const app = express();
import routes from './routes.js'
// routes(express)
// const routes = require("./routes")(express);
// const graphQlRoutes = require("./graphqlRoute")(express);
import graphQlRoutes from './graphqlRoute.js'
// graphQlRoutes
import path from "path";
import webpack from 'webpack'
import config from '../webpack.config.js'
import merge from 'webpack-merge'

// const config = require("../webpack.config.js");
// const merge = require("webpack-merge");
let newConfig = merge(config, {
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ]
});



app.use("/", routes(express));
app.use("/", graphQlRoutes(express));


import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'

 if (process.env.NODE_ENV == "development") {
  const compiler = webpack(newConfig);
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true
  }));
  app.use(webpackHotMiddleware(compiler));
}
else{
  app.use("/", express.static("./dist"));

}

app.listen(3000, () => console.log("Listening on port 3000!\n"));