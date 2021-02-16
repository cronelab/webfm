import express from "express";
import bodyParser from "body-parser"
import compression from "compression";
import infoRoutes from "./routes/info.js";
import dataRoutes from "./routes/data.js";
import routes from "./routes.js";
import config from "../webpack.config.js";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpack from "webpack";
import multer from 'multer'
import path from "path";
import pkg from "webpack-merge";
const { merge } = pkg;

let __dirname = path.resolve(path.dirname(""));
const app = express();
var upload = multer();

app.use(compression());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(upload.any());

const PORT = process.env.PORT || 8090;

let newConfig = merge(config, {
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.HotModuleReplacementPlugin(),
  ],
});

const compiler = webpack(newConfig);
app.use(webpackDevMiddleware(compiler));
app.use("/", routes(express));
app.use("/", infoRoutes(express));
app.use("/", dataRoutes(express));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => console.log(`Serving on port ${PORT}`));

// docker run --rm -it  -p 8090:8090/tcp thebrainchain/webfm:dev

// aws ecr create-repository --repository-name webfm --region region

// aws ecr get-login-password --region us-east-2 | docker login --username chris --password-stdin 200034152832.dkr.ecr.us-east-2.amazonaws.com

 