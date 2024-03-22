//a-loader.js
function ALoader(content, map, meta) {
  console.log("执行 a-loader 的normal阶段");
  return content + "//给你加点注释(来自于Aloader)";
}
ALoader.pitch = (remainingRequest, previousRequest, data) => {
  console.log(remainingRequest, previousRequest, data);
};
module.exports = ALoader;
