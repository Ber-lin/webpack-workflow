import lodash from 'lodash'

const func1=(value)=>{
    return lodash.isArray(value);
}
const func2=(value)=>{
    console.log(222);
}
export {func1,func2}