const path = require("path");
const webpack = require('webpack')
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const WriteFilePlugin = require('write-file-webpack-plugin');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var hotMiddlewareScript =
    "webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true";

const devMode = process.env.NODE_ENV !== "production";

module.exports = {
    entry: {
        index: devMode ? ["./index/index.js", hotMiddlewareScript] : "./index/index.js",
        map: "./map/main.js"
    },
    mode: devMode ? "development" : "production",

    devtool: devMode ? "inline-source-map" : "source-map",

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
    module: {
        rules: [{
                test: /\.js$/,
                exclude: /node_modules/,
                use: ["babel-loader"]
            },
            {
                test: /\.(fbx)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                        presets: ['env'],
                    },
                }, ],
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    devMode ? "style-loader" : MiniCssExtractPlugin.loader,
                    "css-loader",
                    // "postcss-loader",
                    "sass-loader"
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            inject: false,
            hash: true,
            template: "./index/index.html",
            filename: 'index.html',

        }),
        new HtmlWebpackPlugin({
            inject: false,
            hash: true,
            template: "./map/index.html",
            filename: 'map.html',

        }),
        new MiniCssExtractPlugin({
            filename: devMode ? "[name].css" : "[name].css",
            chunkFilename: devMode ? "[id].css" : "[id].css"
        }),
        new WriteFilePlugin()
    ],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        publicPath: path.resolve(__dirname, "dist"),
        globalObject: (`typeof self !== 'undefined' ? self : this`)

    },
    context: path.resolve(__dirname, 'src'),
    devServer: devMode ? {
        contentBase: './dist',
        publicPath: './dist',
        hot: true
    } : {},
};