const { SyncHook } = require("tapable");
const path = require("path");
const fs = require("fs");
const parser = require("@babel/parser");
let types = require("@babel/types"); //用来生成或者判断节点的AST语法树的节点
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;

function toUnixPath(path) {
  return path.replace(/\\/g, "/");
}
const baseDir = toUnixPath(process.cwd());
//获取文件路径
function tryExtensions(modulePath, extensions) {
  // 必须是一模一样，[name].[ext]才可以
  if (fs.existsSync(modulePath)) {
    return modulePath;
  }
  for (let i = 0; i < extensions?.length; i++) {
    let filePath = modulePath + extensions[i];
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  throw new Error(`无法找到${modulePath}`);
}
/**
 *
 * @param {*} chunk
 * @description 生成运行时代码
 */
function getSource(chunk) {
  return `
    (() => {
     var modules = {
       ${chunk.modules.map(
         (module) => `
         "${module.id}": (module) => {
           ${module._source}
         }
       `
       )}  
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
     ${chunk.entryModule._source}
   })();
    `;
}
class Compiler {
  // 2.初始化compiler对象
  constructor(webpackOptions) {
    this.options = webpackOptions;
    this.hook = {
      run: new SyncHook(),
      done: new SyncHook(),
    };
  }

  compile(callback) {
    //虽然webpack只有一个Compiler，但是每次编译都会产出一个新的Compilation，
    //这里主要是为了考虑到watch模式，它会在启动时先编译一次，然后监听文件变化，如果发生变化会重新开始编译
    //每次编译都会产出一个新的Compilation，代表每次的编译结果
    const compilation = new Compilation(this.options);
    compilation.build(callback); // 执行build方法
  }
  // 4.执行run方法开始编译
  run(callback) {
    this.hook.run.call();
    const onCompiled = (err, stats, fileDependencies) => {
      console.log("🌖 ~ file: webpack.js:82 ~ stats:", stats);
      for (let filename in stats.assets) {
        let filePath = path.join(this.options.output.path, filename);
        fs.writeFileSync(filePath, stats.assets[filename], "utf8");
      }

      callback(err, {
        toJson: () => stats,
      });
      fileDependencies.forEach((fileDependency) => {
        fs.watch(fileDependency, () => {
          this.compile(onCompiled);
        });
      });
      this.hook.done.call();
    };
    this.compile(onCompiled);
  }
}

class Compilation {
  constructor(webpackOptions) {
    this.options = webpackOptions;
    this.modules = []; //本次编译所有生成出来的模块
    this.chunks = []; //本次编译产出的所有代码块，入口模块和依赖的模块打包在一起为代码块
    this.assets = {}; //本次编译产出的资源文件
    this.fileDependencies = []; //本次打包涉及到的文件，这里主要是为了实现watch模式下监听文件的变化，文件发生变化后会重新编译
  }
  //当编译模块的时候，name：这个模块是属于哪个代码块chunk的，modulePath：模块绝对路径
  buildModule(name, modulePath) {
    //6.2.1 读取模块内容，获取源代码
    let sourceCode = fs.readFileSync(modulePath, "utf8");
    //buildModule最终会返回一个modules模块对象，每个模块都会有一个id,id是相对于根目录的相对路径
    let moduleId = "./" + path.posix.relative(baseDir, modulePath); //模块id:从根目录出发，找到与该模块的相对路径（./src/index.js）
    //6.2.2 创建模块对象
    let module = {
      id: moduleId,
      names: [name], //names设计成数组是因为代表的是此模块属于哪个代码块，可能属于多个代码块
      dependencies: [], //它依赖的模块
      _source: "", //该模块的代码信息
    };

    // 6.23找到与当前模块匹配的loader处理源码
    let loaders = [];
    let { rules = [] } = this.options.module;
    // console.log("🌖 ~ file: webpack.js:73 ~ this.options:", rules);
    rules.forEach(({ test, use }) => {
      if (modulePath.match(test)) {
        loaders.push(...use);
      }
    });
    sourceCode = loaders.reduceRight((code, loader) => {
      return loader(code);
    }, sourceCode);

    //通过loader翻译后的内容一定得是js内容，因为最后得走我们babel-parse，只有js才能成编译AST
    //第七步：找出此模块所依赖的模块，再对依赖模块进行编译
    //7.1：先把源代码编译成 [AST](https://astexplorer.net/)
    let ast = parser.parse(sourceCode, { sourceType: "module" });
    traverse(ast, {
      CallExpression: (nodePath) => {
        // 目标模块里每一行代码都是一个ast node
        const { node } = nodePath;
        // console.log("🌖 ~ file: webpack.js:90 ~ node:", node);
        // 如果当前ast node是require语句
        if (node.callee.name === "require") {
          let depModuleName = node.arguments[0].value; // 获取当前require的模块名（模块路径）
          let dirname = path.posix.dirname(modulePath); // 获取当前模块所在目录
          let depModulePath = path.posix.join(dirname, depModuleName); // 获取当前模块的绝对路径

          let extensions = this.options.resolve?.extensions || [".js"]; //获取配置中的extensions
          depModulePath = tryExtensions(depModulePath, extensions); //尝试添加后缀，找到一个真实在硬盘上存在的文件
          //   console.log("🌖 ~ file: webpack.js:111 ~ depModulePath:", depModulePath);
          //7.3：将依赖模块的绝对路径 push 到 `this.fileDependencies` 中
          this.fileDependencies.push(depModulePath);
          //7.4：生成依赖模块的`模块 id`
          let depModuleId = "./" + path.posix.relative(baseDir, depModulePath);
          //   console.log("🌖 ~ file: webpack.js:112 ~ depModuleId:", depModuleId);
          //7.5：修改语法结构，把依赖的模块改为依赖`模块 id` require("./name")=>require("./src/name.js")
          node.arguments = [types.stringLiteral(depModuleId)];
          //7.6：将依赖模块的信息 push 到该模块的 `dependencies` 属性中
          module.dependencies.push({ depModuleId, depModulePath });
          //   console.log(
          //     "🌖 ~ file: webpack.js:117 ~ module.dependencies:",
          //     module.dependencies
          //   );
        }
      },
    });
    let { code } = generator(ast);
    module._source = code;
    //7.8：对依赖模块进行编译（对 `module 对象`中的 `dependencies` 进行递归执行 `buildModule` ）
    module.dependencies.forEach(({ depModuleId, depModulePath }) => {
      //考虑到多入口打包 ：一个模块被多个其他模块引用，不需要重复打包，这里的this就是compilation对象
      let existModule = this.modules.find((item) => item.id === depModuleId);
      //   console.log("🌖 ~ file: webpack.js:130 ~ this:", existModule);
      //如果modules里已经存在这个将要编译的依赖模块了，那么就不需要编译了，直接把此代码块的名称添加到对应模块的names字段里就可以
      if (existModule) {
        //names指的是它属于哪个代码块chunk
        existModule.names.push(name);
      } else {
        //7.9：对依赖模块编译完成后得到依赖模块的 `module 对象`，push 到 `this.modules` 中
        let depModule = this.buildModule(name, depModulePath);
        this.modules.push(depModule);
      }
      // console.log("🌖 ~ file: webpack.js:140 ~ this:", this);
    });
    //7.10：等依赖模块全部编译完成后，返回入口模块的 `module` 对象
    return module;
  }
  build(callback) {
    // 开始构建工作，执行结束调用callback

    // 5.初始化入口文件
    let entry = {};
    // 这里要兼容entry为字符串的情况
    if (typeof this.options.entry === "string") {
      entry.main = this.options.entry;
    } else {
      entry = this.options.entry;
    }
    //第六步：从入口文件出发，调用配置的 `loader` 规则，对各模块进行编译
    for (let entryName in entry) {
      //entryName="main" entryName就是entry的属性名，也将会成为代码块的名称
      let entryFilePath = path.posix.join(baseDir, entry[entryName]); //path.posix为了解决不同操作系统的路径分隔符,这里拿到的就是入口文件的绝对路径
      //6.1 把入口文件的绝对路径添加到依赖数组（`this.fileDependencies`）中，记录此次编译依赖的模块
      this.fileDependencies.push(entryFilePath);
      //6.2 得到入口模块的的 `module` 对象 （里面放着该模块的路径、依赖模块、源代码等）
      let entryModule = this.buildModule(entryName, entryFilePath);
      //6.3 将生成的入口文件 `module` 对象 push 进 `this.modules` 中
      this.modules.push(entryModule);
      //第八步：等所有模块都编译完成后，根据模块之间的依赖关系，组装代码块 `chunk`（一般来说，每个入口文件会对应一个代码块`chunk`，每个代码块`chunk`里面会放着本入口模块和它依赖的模块）
      let chunk = {
        name: entryName,
        entryModule,
        modules: this.modules.filter((item) => item.names.includes(entryName)), //找出属于该代码块的模块
      };
      this.chunks.push(chunk);
    }
    //第九步：把各个代码块 `chunk` 转换成一个一个文件加入到输出列表
    this.chunks.forEach((chunk) => {
      let filename = this.options.output.filename.replace("[name]", chunk.name);
      this.assets[filename] = getSource(chunk);
    });
    callback(
      null,
      {
        chunks: this.chunks,
        modules: this.modules,
        assets: this.assets,
      },
      this.fileDependencies
    );

    // console.log("🌖 ~ file: webpack.js:167 ~ this:", this.modules);
  }
}
// 1.读取配置项
function webpack(webpackOptions) {
  const compiler = new Compiler(webpackOptions);
  //   console.log("🌖 ~ file: webpack.js:173 ~ compiler:", compiler);
  // 3.执行插件
  const { plugins } = webpackOptions;
  for (let plugin of plugins) {
    plugin.apply(compiler);
  }

  return compiler;
}

function loader1(content) {
  return content + "// 加点注释loader1";
}
function loader2(content) {
  return content + "// 加点注释loader2";
}
module.exports = { webpack, loader1, loader2 };
