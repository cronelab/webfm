const express = require("express");
const app = express();
const routes = require("./routes")(express);
const path = require('path')
const webpack = require("webpack");
const config = require("../webpack.config.js");
const merge = require("webpack-merge");
let newConfig = merge(config, {
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ]
});

const serveConfig = configName => {
  return (req, res) => {
    res.sendFile(__dirname + "/config/" + configName);
  };
};

app.use("/", routes);
app.get("/index/config/online", serveConfig("fmonline.json"));

app.get('/map/config/ui', serveConfig('fmui.json'));
app.get('/map/config/online', serveConfig('fmonline.json'));
app.get('/map/config/tasks', serveConfig('tasks.json'));


if (process.env.NODE_ENV == "production") {
  app.use("/", express.static("./dist"));
} else if (process.env.NODE_ENV == "development") {
  const compiler = webpack(newConfig);
  app.use(require("webpack-dev-middleware")(compiler, {
    noInfo: true
  }));
  app.use(require("webpack-hot-middleware")(compiler));
}
else{
  app.use("/", express.static("./dist"));

}

app.listen(3000, () => console.log("Listening on port 3000!\n"));