function BLoader(content, map, meta) {
    console.log("执行 b-loader 的normal阶段");
    return content + "//给你加点注释(来自于BLoader)";
  }
  BLoader.pitch = () => {
    console.log("Bloader的pitch阶段");
  };
  module.exports = BLoader;
  