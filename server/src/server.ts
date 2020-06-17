import express from "express";
import compression from "compression";
import routes from "./routes.js";
import config from "../../webpack.config.js";
// import graphQlRoutes from "./graphqlRoute.js";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackHotMiddleware from "webpack-hot-middleware";
import merge from "webpack-merge";
import webpack from "webpack";
const app = express();
app.use(compression());
app.use(express.json());
// app.use("/", graphQlRoutes(express));
import path from "path";
let __dirname = path.resolve(path.dirname(""));

let newConfig = merge(config, {
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
});

const compiler = webpack(newConfig);
app.use(webpackDevMiddleware(compiler));
// app.use(webpackHotMiddleware(compiler));

app.use("/", routes(express));

app.get("*", function (req, res) {
  res.sendFile(path.resolve(__dirname, "dist/index.html"), function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
});

app.listen(8090, () => console.log("Serving"));
