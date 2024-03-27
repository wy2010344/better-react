import { dom } from "better-react-dom"
import { emptyObject } from "wy-helper"
import { kanren, KSubsitution, KVar, Stream, walk } from "wy-helper/kanren"

let globalMap: Map<string, KVar> | undefined = undefined
const V: Record<string, KVar> = new Proxy<{
  [key: string]: KVar
}>(emptyObject, {
  get(a, key: string) {
    if (globalMap) {
      let oldVar = globalMap.get(key)
      if (!oldVar) {
        oldVar = new KVar()
        globalMap.set(key, oldVar)
      }
      return oldVar
    } else {
      throw new Error(`必须在规则的执行中`)
    }
  }
})

function generic<T extends any[], O>(call: (...vs: T) => O) {
  return function (...vs: T) {
    const map = new Map<string, KVar>()
    globalMap = map
    const o = call(...vs)
    globalMap = undefined
    return o
  }
}

function outExp<O>(call: () => O) {
  const map = new Map<string, KVar>()
  globalMap = map
  const out = call()
  globalMap = undefined
  return [out, map] as const
}

const subGoal = generic(function (bc: KVar, ab: KVar) {
  return kanren.unify(bc, ab)
})


const [goal, map] = outExp(function () {
  return kanren.and(
    kanren.unify(V.AB, 98),
    subGoal(V.BC, V.AB)
  )
})

let stream: Stream<KSubsitution> | undefined = goal(null)
export default function () {
  dom.div().render(function () {
    dom.button({
      onClick() {
        const sub = stream?.left
        if (sub) {
          map.forEach((value, key) => {
            console.log("key--", key, "--value--", walk(value, sub))
          })
        }
        stream = stream?.right()
      }
    }).renderText`生成`
  })
}