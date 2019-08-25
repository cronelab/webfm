import path from "path";
import webpack from 'webpack'
import HtmlWebpackPlugin from "html-webpack-plugin";
import CleanWebpackPlugin from "clean-webpack-plugin";


import WriteFilePlugin from 'write-file-webpack-plugin';
let __dirname = path.resolve(path.dirname(''));
import MiniCssExtractPlugin from "mini-css-extract-plugin";
const devMode = process.env.NODE_ENV !== "production";

const module = {
    mode: devMode ? "development" : "production",

    devtool: devMode ? "inline-source-map" : "source-map",

    entry: {
        index: './src/index/main.js',
        record: './src/record/main.js'
    },
    module: {
        rules: [{
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                    plugins: [
                        "@babel/plugin-syntax-dynamic-import",
                        "@babel/plugin-transform-modules-commonjs",
                        "@babel/plugin-transform-runtime",
                        "@babel/plugin-proposal-class-properties",
                    ],
                    cacheDirectory: true
                }
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [{
                        loader: "style-loader"
                    }, {
                        loader: "css-loader"
                    },
                    {
                        loader: "postcss-loader"
                    }, {
                        loader: "sass-loader",
                    }
                ]
            }
        ]
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
            filename: 'index.html',
            chunks: ['index'],
            title: 'WebFM'
        }),
        new HtmlWebpackPlugin({
            hash: true,
            template: "./src/record/index.html",
            filename: 'record.html',
            chunks: ['record'],
            title: 'WebFM'
        }),
    ],

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].[hash].js",
        globalObject: (`typeof self !== 'undefined' ? self : this`)

    }
}
export default module