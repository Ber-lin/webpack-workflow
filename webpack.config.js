const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const path = require("path");
const DonePlugin=require('./src/plugins/done')
const TestPlugin=require('./src/plugins/test')

module.exports = {
  mode: "development", //开发模式
  entry: "./src/index.jsx", //入口
  devtool: false,
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "./dist"),
  },
  // devServer: {
  //   hot: true, //开启热更新，这个是关键！！！
  //   port: 8000, //设置端口号
  // },
  resolveLoader: {
    modules: ["src/loaders", "node_modules"],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: [
          {
            loader: "a-loader",

          },
          // {
          //   loader: "b_loader",

          //   enforce: "post",
          // },
          // {
          //   loader: "c-loader",

          //   enforce: "pre",
          // },
          // {
          //   loader: "d-loader",

          //   enforce: "post",
          // },
          // {
          //   loader: "e-loader",

          //   enforce: "pre",
          // },
        ],
      },
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        enforce: "post",
        use:[
          {
            loader: "b_loader",
          }
        ]
      },
      {
        test: /\.(js|ts)x?$/i,
        exclude: /node_modules/,
        // use: ["babel-loader", "b_loader" , "a-loader"],
        // use:[
        //   {
        //     loader: 'my-babel-loader',
        //     options:{
        //       presets: ['@babel/preset-env']
        //     }
        //   }
        // ]
        use: ["babel-loader"],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html", //将打包后的代码插入到html模版中
    }),
    new ReactRefreshWebpackPlugin(),
    // new BundleAnalyzerPlugin(),
    new DonePlugin(),
    new TestPlugin(),
  ],
};
