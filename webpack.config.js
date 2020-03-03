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
		main: './src/index.tsx',
		reconstruction3D: "./src/reconstruction3D/main.js"
	},

	node: {
		fs: 'empty'
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".jsx"]
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				options: {
					configFile: 'tsconfig.json'
				}
			},
			{
				test: /\.js|jsx$/,
				exclude: /node_modules/,
				loader: "babel-loader",
				options: {
					presets: ["@babel/preset-env", "@babel/preset-react"],
					plugins: [
						"@babel/plugin-syntax-dynamic-import",
						"@babel/plugin-transform-modules-commonjs",
						"@babel/plugin-transform-runtime",
						"@babel/plugin-proposal-class-properties",
						"@babel/plugin-proposal-export-default-from"
					],
					cacheDirectory: true
				}
			},
			{
				test: /\.(png|jpe?g|gif|fbx|glb|gltf|nii|mgz)$/i,
				loader: 'file-loader',
				options: {
					name: '[path][name].[ext]',
				},
			},
			{
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
		new WriteFilePlugin(),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css"
		}),
		new HtmlWebpackPlugin({
			template: './src/index.html',
			filename: "index.html",
			hash: true,
			chunks: ["main"]

		}),
		new HtmlWebpackPlugin({
			hash: true,
			template: "./src/reconstruction3D/index.html",
			filename: "reconstruction3D.html",
			chunks: ["reconstruction3D"],
			title: "WebFM"
		}),
	],
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "[name].[hash].js",
		globalObject: `typeof self !== 'undefined' ? self : this`,
		publicPath: '/'

	}
};
export default module;