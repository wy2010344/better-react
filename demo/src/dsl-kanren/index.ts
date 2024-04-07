import { dom } from "better-react-dom"
import { emptyObject } from "wy-helper"
import { Goal } from "wy-helper/dist/kanren"
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



let globalAnd: Goal<any> | undefined = undefined
function And(goal: Goal<any>) {
  if (globalAnd) {
    globalAnd = kanren.and(globalAnd, goal)
  } else {
    globalAnd = goal
  }
}
function Cut(goal: Goal<any>) {
  if (globalAnd) {
    globalAnd = kanren.cut(globalAnd, goal)
  } else {
    throw new Error("new global and")
  }
}
function genericAnd<T extends any[], O>(call: (...vs: T) => void) {
  return function (...vs: T) {
    const map = new Map<string, KVar>()
    globalMap = map
    call(...vs)
    globalMap = undefined
    const o = globalAnd
    globalAnd = undefined
    return o!
  }
}

let globalOr: Goal<any> | undefined = undefined
function Or(goal: Goal<any>) {
  if (globalOr) {
    globalOr = kanren.or(globalOr, goal)
  } else {
    globalOr = goal
  }
}
function genericOr<T extends any[], O>(call: (...vs: T) => O) {
  return function (...vs: T) {
    const map = new Map<string, KVar>()
    globalMap = map
    call(...vs)
    globalMap = undefined
    const o = globalOr
    globalOr = undefined
    return o!
  }
}


function outExp<O>(call: () => O) {
  const map = new Map<string, KVar>()
  globalMap = map
  const out = call()
  globalMap = undefined
  return [out, map] as const
}

const subGoal = genericAnd(function (bc: KVar, ab: KVar) {
  And(kanren.unify(bc, ab))
})

const subGoal1 = genericAnd(function () {
  And(kanren.unify(V.AB, 98))
  And(subGoal(V.BC, V.AB))
})
const [goal, map] = outExp(function () {
  return subGoal1()
})

let stream: Stream<KSubsitution> | undefined = goal(null)
export default function () {
  dom.div().renderFragment(function () {
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