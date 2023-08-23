var a = 98

console.log(a)

class Var {
  constructor(
    public readonly pool: any,
    public readonly key: string
  ) { }
}
let globalMap: Map<string, Var> | undefined = undefined
const V = new Proxy<{
  [key: string]: Var
}>({}, {
  get(a, key: string) {
    if (globalMap) {
      let oldVar = globalMap.get(key)
      if (!oldVar) {
        oldVar = new Var(globalMap, key)
        globalMap.set(key, oldVar)
      }
      return oldVar
    } else {
      throw new Error(`必须在规则的执行中`)
    }
  }
})
function generic(call: () => any) {
  return function () {
    const map = new Map<string, Var>()
    globalMap = map
    call()
    globalMap = undefined
  }
}

type FunType = {
  type: "fun"
  args: {
    [key: string]: any
  },
  ret: any
}


/**
 * ()=>(<X>(value:X)=>X)
 */
const getGenric: FunType = {
  type: "fun",
  args: {},
  ret: generic(function () {
    return {
      type: "fun",
      args: {
        value: V.X
      },
      ret: V.X
    }
  })
}

/**
 * (
 *  list:List<T>,
 *  trans:T->B
 * )->list<B>
 */
const mapGeneric = {

}

console.log("sbc")

export const x = 9
