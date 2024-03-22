class DonePlugin{
    apply(compiler){
        console.log('done plugin');

        compiler.hooks.done.tap('DonePlugin', (stats) => {
            console.log('done');
            // console.log(stats);
        });
    }
}
module.exports = DonePlugin;