import express from 'express'

import routes from './routes.js'
import config from '../webpack.config.js'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import merge from 'webpack-merge'
import webpack from 'webpack'

const app = express();

let newConfig = merge(config, {
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ]
});



const compiler = webpack(newConfig);
app.use(webpackDevMiddleware(compiler, {
    noInfo: true
}));
app.use(webpackHotMiddleware(compiler));
app.use("/", routes(express));



app.listen(8080, () => console.log("Serving"));