import path from "path";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CleanWebpackPlugin from "clean-webpack-plugin";

import WriteFilePlugin from "write-file-webpack-plugin";
let __dirname = path.resolve(path.dirname(""));
import MiniCssExtractPlugin from "mini-css-extract-plugin";
const devMode = process.env.NODE_ENV !== "production";

const module = {
  mode: devMode ? "development" : "production",

  devtool: devMode ? "inline-source-map" : "source-map",

  entry: {
    index: "./src/index/main.js",
    record: "./src/record/main.js",
    map: "./src/map/main.js"
    // cortstim: "./cortstim/cortstim.js",
    // streamSaver: "./streamSaver/index.js",
    // cceps: "./CCEPS/index.js"
  },
  module: {
    rules: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env"],
          plugins: [
            "@babel/plugin-syntax-dynamic-import",
            "@babel/plugin-transform-modules-commonjs",
            "@babel/plugin-transform-runtime",
            "@babel/plugin-proposal-class-properties"
          ],
          cacheDirectory: true
        }
      },
      {
        test: /\.(fbx)$/,
        use: [{
          loader: "file-loader",
          options: {
            name: "[path][name].[ext]",
            presets: ["env"]
          }
        }],
        test: /\.(sa|sc|c)ss$/,
        use: [{
            loader: devMode ? "style-loader" : MiniCssExtractPlugin.loader
          },
          {
            loader: "css-loader"
          },
          {
            loader: "postcss-loader"
          },
          {
            loader: "sass-loader"
          }
        ]
      },
      {
        test: /\.worker\.js$/,
        use: {
          loader: "worker-loader"
        }
      }
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        styles: {
          name: "styles",
          test: /\.css$/,
          chunks: "all",
          enforce: true
        }
      }
    },
    usedExports: true
  },
  plugins: [
    new CleanWebpackPlugin.CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
    new WriteFilePlugin(),
    new HtmlWebpackPlugin({
      hash: true,
      template: "./src/index/index.html",
      filename: "index.html",
      chunks: ["index"],
      title: "WebFM"
    }),
    new HtmlWebpackPlugin({
      hash: true,
      template: "./src/record/index.html",
      filename: "record.html",
      chunks: ["record"],
      title: "WebFM"
    }),
    new HtmlWebpackPlugin({
      hash: true,
      template: "./src/map/index.html",
      filename: "map.html",
      chunks: ["map"],
      title: "WebFM"
    })
  ],

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[hash].js",
    globalObject: `typeof self !== 'undefined' ? self : this`
  }
};
export default module;