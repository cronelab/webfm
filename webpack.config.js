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
        map: "./map/map.js",
        replay: "./replay/replay.js",
        threeD: "./threeD/threeD.js",
        cortstim: "./cortstim/cortstim.js",
        streamSaver: "./streamSaver/index.js",
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
                use: [{
                        loader: devMode ? "style-loader" : MiniCssExtractPlugin.loader
                    }, {
                        loader: "css-loader"
                    },
                    {
                        loader: "postcss-loader"
                    }, {
                        loader: "sass-loader",
                        options: {
                            implementation: require("sass")
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: devMode ? "[name].css" : "[name].css",
            chunkFilename: devMode ? "[id].css" : "[id].css"
        }),
        new WriteFilePlugin(),
        new HtmlWebpackPlugin({
            hash: true,
            template: "./index/index.html",
            filename: 'index.html',
            chunks: ['index'],
            title: 'WebFM'
        }),
        new HtmlWebpackPlugin({
            hash: true,
            template: "./replay/replay.html",
            filename: 'replay.html',
            chunks: ['replay'],
            title: 'WebFM: Replay'

        }),
        new HtmlWebpackPlugin({
            hash: true,
            template: "./map/map.html",
            filename: 'map.html',
            chunks: ['map'],
            title: 'WebFM: Map'

        }),
        new HtmlWebpackPlugin({
            hash: true,
            template: "./cortstim/index.html",
            filename: 'cortstim.html',
            chunks: ['cortstim'],
            title: 'WebFM: Cortstim'
        }),
        new HtmlWebpackPlugin({
            hash: true,
            template: "./streamSaver/index.html",
            filename: 'streamSaver.html',
            chunks: ['streamSaver'],
            title: 'WebFM: Streaming'
        }),
    ],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].[hash].js",
        globalObject: (`typeof self !== 'undefined' ? self : this`)

    },
    context: path.resolve(__dirname, 'src'),
    devServer: devMode ? {
        contentBase: './dist',
        publicPath: './dist',
        hot: true
    } : {},
};