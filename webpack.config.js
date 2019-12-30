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
	entry: './src/index.tsx',
	devServer: {
		historyApiFallback: true,
	},
	// {
	// index: "./src/index/main.ts",
	// record: "./src/record/main.ts",
	// map: "./src/map/main.ts",
	// index_r: "./src/index.tsx",
	// record_r: "./src/record_react/Record.tsx"
	// streamSaver: "./streamSaver/index.js",
	// cceps: "./src/CCEPS/index.js",
	// threeD: "./src/3DViewer/main.js",
	// loader_nifti: "./src/loader_nifti/main.js"

	// },
	node: {
		fs: 'empty'
	},
	resolve: {
		// Add `.ts` and `.tsx` as a resolvable extension.
		extensions: [".ts", ".tsx", ".js", ".jsx"]
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
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
			template: './src/index.html'
		})
	],
	// 	new HtmlWebpackPlugin({
	// 		hash: true,
	// 		template: "./src/index/index.html",
	// 		filename: "index.html",
	// 		chunks: ["index_original"],
	// 		title: "WebFM"
	// 	}),
	// 	new HtmlWebpackPlugin({
	// 		hash: true,
	// 		template: "./src/record/index.html",
	// 		filename: "record.html",
	// 		chunks: ["record"],
	// 		title: "WebFM"
	// 	}),
	// 	new HtmlWebpackPlugin({
	// 		hash: true,
	// 		template: "./src/map/index.html",
	// 		filename: "map.html",
	// 		chunks: ["map"],
	// 		title: "WebFM"
	// 	}),
	// 	new HtmlWebpackPlugin({
	// 		hash: true,
	// 		template: "./src/CCEPS/index.html",
	// 		filename: "cceps.html",
	// 		chunks: ["cceps"],
	// 		title: "WebFM"
	// 	}),
	// 	new HtmlWebpackPlugin({
	// 		hash: true,
	// 		template: "./src/3DViewer/index.html",
	// 		filename: "threeD.html",
	// 		chunks: ["threeD"],
	// 		title: "WebFM"
	// 	}),
	// 	new HtmlWebpackPlugin({
	// 		hash: true,
	// 		template: "./src/loader_nifti/index.html",
	// 		filename: "loader_nifti.html",
	// 		chunks: ["loader_nifti"],
	// 		title: "WebFM"
	// 	}),
	// 	new HtmlWebpackPlugin({
	// 		hash: true,
	// 		template: "./src/index.html",
	// 		filename: "index.html",
	// 		chunks: ["index_r"],
	// 		title: "WebFM"
	// 	}),
	// 	new HtmlWebpackPlugin({
	// 		hash: true,
	// 		filename: "record_r.html",
	// 		chunks: ["record_r"],
	// 		title: "WebFM"
	// 	})
	// ],
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "index_bundle.js",
		// filename: "[name].[hash].js",
		globalObject: `typeof self !== 'undefined' ? self : this`,
		publicPath: '/'

	}
};
export default module;