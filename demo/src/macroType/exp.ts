
/**
 * 表达式,有个主函数,有多个按需的参数
 */
export type ExpType = {
  main: any
  map: {
    [key: string]: any
  }
}

/**
 * 函数即是类,有多个入参,有多个导出
 * 然后结构体亦是契约
 * 在传统面向对象中,协议的方法是在类上,不是实例里的返回值
 */
type FunctionType = {
  inMap: {
    [key: string]: any
  }
  outMap: {
    [key: string]: any
  }
}