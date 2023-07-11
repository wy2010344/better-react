/**
 * 更好的语言
 * 参数因为有默认值,其实和内部变量是一样的
 * 所有内部变量可以重写赋值,也可以导出
 * 树形的结构,省略async\await,都是async\await的.
 * 而函数调用的每一层,都是Promise.all,到达齐后才进行.
 * 然后没有返回值的,也可以有个空的函数
 * 
 * 
 * abc : (empty (abc bcd efg))
 * (abc bcd efg afc)
 * 
 */
console.log("ccc")

const a: any = {}

export { }