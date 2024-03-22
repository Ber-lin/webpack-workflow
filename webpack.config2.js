const path = require("path");
const { WebpackDonePlugin, WebpackRunPlugin } = require("./src/plugins");
const { loader1, loader2 } = require("./src/webpack");

module.exports = {
  mode: "development", //防止代码被压缩
  entry: "./src/index.js", //入口文件
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  devtool: "source-map", //防止干扰源文件
  resolveLoader: {
    modules: ["src/loaders", "node_modules"],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: [loader1, loader2],
      },
    ],
  },
  plugins: [new WebpackRunPlugin(), new WebpackDonePlugin()],
  resolve: {
    extensions: ["", ".js", ".jsx"],
  },
};
