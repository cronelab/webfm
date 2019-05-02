const express = require("express");
const app = express();
const routes = require("./routes")(express);
const graphQlRoutes = require("./graphqlRoute")(express);

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



app.use("/", routes);
app.use("/", graphQlRoutes);




 if (process.env.NODE_ENV == "development") {
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