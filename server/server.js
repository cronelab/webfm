import express from "express";
import compression from "compression";
import routes from "./routes.js";
import config from "../webpack.config.js";
import webpackDevMiddleware from "webpack-dev-middleware";
import pkg from "webpack-merge";
const {merge} = pkg;
import webpack from "webpack";
const app = express();
app.use(compression());
app.use(express.json());
import path from "path";
let __dirname = path.resolve(path.dirname(""));

const PORT = 8090

let newConfig = merge(config, {
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
});

const compiler = webpack(newConfig);
app.use(webpackDevMiddleware(compiler));


app.use("/", routes(express));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Serving on port ${PORT}`));
