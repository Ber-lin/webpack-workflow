//自定义插件WebpackRunPlugin
class WebpackRunPlugin {
  apply(compiler) {
    compiler.hook.run.tap("WebpackRunPlugin", () => {
      console.log("开始编译");
    });
  }
}

//自定义插件WebpackDonePlugin
class WebpackDonePlugin {
  apply(compiler) {
    compiler.hook.done.tap("WebpackDonePlugin", () => {
      console.log("结束编译");
    });
  }
}
module.exports = {
  WebpackRunPlugin,
  WebpackDonePlugin,
};
