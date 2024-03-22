//a-loader.js
function DLoader(content, map, meta) {
    console.log("执行 d-loader 的normal阶段");
    return content + "//给你加点注释(来自于Dloader)";
  }
  DLoader.pitch = () => {
    console.log("Dloader的pitch阶段");
  };
  module.exports = DLoader;
  