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
        index: './app/index/main.js'
    },
    module: {
        rules: [{
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
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
            template: "./app/index/index.html",
            filename: 'index.html',
            chunks: ['index'],
            title: 'WebFM'
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        })
    ],

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].[hash].js",
        globalObject: (`typeof self !== 'undefined' ? self : this`)

    }
}
export default module