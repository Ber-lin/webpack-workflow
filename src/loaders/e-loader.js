//a-loader.js
function ELoader(content, map, meta) {
    console.log("执行 e-loader 的normal阶段");
    return content + "//给你加点注释(来自于Eloader)";
  }
  ELoader.pitch = () => {
    console.log("Eloader的pitch阶段");
  };
  module.exports = ELoader;
  