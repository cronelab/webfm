import express from "express";
import compression from "compression";
import routes from "./routes.js";
// import config from "../webpack.config.js";
// import webpackDevMiddleware from "webpack-dev-middleware";
// import merge from "webpack-merge";
// import webpack from "webpack";
const app = express();
app.use(compression());
app.use(express.json());
import path from "path";
let __dirname = path.resolve(path.dirname(""));

// let newConfig = merge(config, {
//   plugins: [
//     new webpack.optimize.OccurrenceOrderPlugin(true),
//     new webpack.HotModuleReplacementPlugin(),
//     new webpack.NoEmitOnErrorsPlugin(),
//   ],
// });

// const compiler = webpack(newConfig);
// app.use(webpackDevMiddleware(compiler));

app.use("/", routes(express));
console.log(__dirname)

// app.get("*", function (req, res) {
//   res.send(path.resolve(__dirname, "dist"))
//   // res.sendFile(path.resolve(__dirname, "dist/index.html"), function (err) {
//   //   if (err) {
//   //     res.status(500).send(err);
//   //   }
//   // });
// });
app.use(express.static(path.resolve(__dirname, "dist")));

app.listen(8090, () => console.log("Serving"));
