

type Scope = {
  [key: string]: any
}
export type AST = Component


/**
 * 组件
 */
type Component = {
  type: "component"
  params: {
    [key: string]: any
  }
  body: ComponentBodyRow[]
}
type ComponentBodyRow = {
  type: "bind"
  key: string
  value: CallExp
} | CallExp


type CallExp = {
  type: "call"
  fun: string
  params: {
    [key: string]: any
  }
}



/**
 * 假设这段AST-JSON是后端组装传递来的
 * 最简单,是动态调用本地已经有的组件
 * 复杂一点,有自定义组件,然后调用自定义组件.
 * 然后加上类型验证再执行,避免客户端出错.
 * 
 * 验证,在非验证之上
 * @param o 
 */
export function evaluate(o: CallExp, context: Scope) {
  const define = context[o.fun]
  if (define) {
    if (define.type == "component") {

    } else {
      console.error("需要是组件", define)
    }
  } else {
    console.error("没有在作用域上找到定义", o.fun)
  }
}