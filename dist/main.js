
    (() => {
     var modules = {
       
         "./src/scripts/name.js": (module) => {
           module.exports = 'fuling'; // 加点注释loader2// 加点注释loader1
         }
       ,
         "./src/scripts/age.js": (module) => {
           const name = require("./src/scripts/name.js");
const a = 1;
module.exports = 99;
// 加点注释loader2// 加点注释loader1
         }
       ,
         "./src/index.js": (module) => {
           const name = require("./src/scripts/name.js");
const age = require("./src/scripts/age.js");
console.log(name, ' ', age); // 加点注释loader2// 加点注释loader1
         }
         
     };
     var cache = {};
     function require(moduleId) {
       var cachedModule = cache[moduleId];
       if (cachedModule !== undefined) {
         return cachedModule.exports;
       }
       var module = (cache[moduleId] = {
         exports: {},
       });
       modules[moduleId](module, module.exports, require);
       return module.exports;
     }
     var exports ={};
     const name = require("./src/scripts/name.js");
const age = require("./src/scripts/age.js");
console.log(name, ' ', age); // 加点注释loader2// 加点注释loader1
   })();
    