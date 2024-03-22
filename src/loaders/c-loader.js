//a-loader.js
function CLoader(content, map, meta) {
    console.log("执行 c-loader 的normal阶段");
    return content + "//给你加点注释(来自于Cloader)";
  }
  CLoader.pitch = () => {
    console.log("Cloader的pitch阶段");
  };
  module.exports = CLoader;
  