import express              from 'express'
import webpack              from 'webpack'
import routes               from './routes.js'
import merge                from 'webpack-merge'
import config               from '../webpack.config.js'
import graphQlRoutes        from './graphqlRoute.js'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
const app = express();

let newConfig = merge(config, {
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ]
});



app.use("/", routes(express));
app.use("/", graphQlRoutes(express));



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