import { addDelect } from "./commitWork"
import {
  arrayNotEqualDepsWithEmpty, draftFiber, EMPTYCONSTARRAY,
  revertFiber,
  simpleUpdateFiber,
  storeRef, toWithDraftFiber, useCurrentFiber,
  useEffect, useFiber, useMemo
} from "./fc"
import { Fiber, fiberDataClone, getEditData, isChangeBodyFiber, isWithDraftFiber, PlacementFiber } from "./Fiber"
import { AskNextTimeWork, setRootFiber } from "./reconcile"
export { flushSync, startTransition } from './reconcile'
export type { REAL_WORK } from './reconcile'
export {
  useReducer, useEffect, useAttrEffect, useBeforeAttrEffect, storeRef, useMemo,
  createContext, useFiber, arrayNotEqualDepsWithEmpty,
  arrayEqual, simpleEqual, quote, EMPTYCONSTARRAY, useCurrentFiber
} from './fc'
export type { ReducerResult, ReducerFun } from './fc'
export type { Fiber, Props, VirtaulDomNode, ChangeBodyFiber as WithDraftFiber, PlacementFiber, FindParentAndBefore, HookValueSet } from './Fiber'
export type { AskNextTimeWork }
export { createChangeAtom, ChangeAtomValue } from './commitWork'

export function render(
  render: () => void,
  ask: AskNextTimeWork
) {
  const rootFiber: Fiber = {
    effectTag: "PLACEMENT",
    draft: {
      render
    }
  } as const
  return setRootFiber(rootFiber, ask)
}

////////****useMap****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export type Translate<M, T> = {
  size(m: M): number
  get(m: M, i: number): T
}
export type MapRowRender<T extends any[]> = readonly [
  any,
  (v: T) => void,
  T,
] | readonly [
  any,
  () => void
]
function createMapRef() {
  return storeRef(new Map<any, Fiber[]>())
}

/**
 * 最大兼容优化,减少过程中的声明
 * @param data 
 * @param translate 
 * @param render 
 * @param deps 
 */
export function useMapF<M, K>(
  data: M,
  translate: Translate<M, K>,
  /**中间不允许hooks,应该处理一下*/
  render: (row: K, i: number) => MapRowRender<any>,
  deps?: readonly any[]
): void {
  useFiber(function () {
    const mapRef = useMemo(createMapRef, EMPTYCONSTARRAY);
    const oldMap = cloneMap(mapRef.get())
    const newMap = new Map<any, Fiber[]>()
    useEffect(function () {
      mapRef.set(newMap)
    })

    const parentFiber = useCurrentFiber()
    const draft = parentFiber.draft
    let beforeFiber: Fiber | undefined = undefined
    //提前置空
    draft.child = undefined
    draft.lastChild = undefined

    const maxSize = translate.size(data)
    for (let i = 0; i < maxSize; i++) {
      const v = translate.get(data, i)

      draftFiber()
      const [key, rowRender, deps] = render(v, i)
      revertFiber()

      const oldFibers = oldMap.get(key)
      let oldFiber = oldFibers?.[0]
      if (oldFiber) {
        //因为新排序了,必须产生draft用于排序,
        if (isWithDraftFiber(oldFiber)) {
          if (isChangeBodyFiber(oldFiber)) {
            const oldDraft = oldFiber.draft
            oldDraft.render = rowRender
            oldDraft.deps = deps
            oldDraft.prev = beforeFiber
          } else {
            const msg = "此处不允许有排序的Fiber"
            console.error(msg, oldFiber)
            throw new Error(msg)
          }
        } else {
          if (arrayNotEqualDepsWithEmpty(oldFiber.current.deps, deps)) {
            const oldDraft = toWithDraftFiber(oldFiber).draft
            oldDraft.render = rowRender
            oldDraft.deps = deps
            oldDraft.prev = beforeFiber
          } else {
            //很可能,此时状态被setState更新
            const nOldFiber = oldFiber as any
            let draft = nOldFiber.draft
            if (!draft) {
              draft = fiberDataClone(oldFiber.current);
              nOldFiber.draft = draft;
            }
            draft.prev = beforeFiber
          }
        }
        oldFibers?.shift()
      } else {
        const tempFiber: PlacementFiber = {
          effectTag: "PLACEMENT",
          parent: parentFiber,
          draft: {
            render: rowRender,
            deps,
            prev: beforeFiber
          }
        }
        oldFiber = tempFiber
      }
      const newFibers = newMap.get(key) || []
      if (newFibers.length > 0) {
        console.warn(`重复的key---重复${newFibers.length}次数`, key)
      }
      newFibers.push(oldFiber)
      newMap.set(key, newFibers)

      //构建双向树
      if (beforeFiber) {
        getEditData(beforeFiber).sibling = oldFiber
      } else {
        draft.child = oldFiber
      }
      draft.lastChild = oldFiber
      getEditData(oldFiber).sibling = undefined

      beforeFiber = oldFiber
    }

    for (const olds of oldMap.values()) {
      for (const old of olds) {
        addDelect(old)
      }
    }

  }, deps)
}
export function cloneMap<T>(map: Map<any, T[]>) {
  const newMap = new Map<any, T[]>()
  map.forEach(function (v, k) {
    newMap.set(k, v.slice())
  })
  return newMap
}
////////****single****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type OneProps<T extends readonly any[] = readonly any[]> = readonly [any, (deps: T) => void, T]
  | readonly [any, () => void]

function initCache() {
  return {} as {
    key?: any,
    fiber?: Fiber
  }
}
export function useOneF<M>(data: M, outRender: (data: M) => OneProps<any[]>, outDeps?: readonly any[]): void {
  useFiber(function () {
    draftFiber()
    const [key, render, deps] = outRender(data)
    revertFiber()

    let commitWork: (() => void) | void = undefined
    const fiber = useCurrentFiber()
    const cache = useMemo(initCache, EMPTYCONSTARRAY)
    if (cache.key == key && cache.fiber) {
      //key相同复用
      simpleUpdateFiber(cache.fiber, render, deps)
    } else {
      //删旧增新
      if (cache.fiber) {
        //节点存在
        addDelect(cache.fiber)
      }
      const placeFiber: PlacementFiber = {
        effectTag: "PLACEMENT",
        parent: fiber,
        draft: {
          render,
          deps
        }
      }
      commitWork = () => {
        cache.key = key
        cache.fiber = placeFiber
      }
      //只有一个节点,故是同一个
      fiber.draft.lastChild = placeFiber
      fiber.draft.child = placeFiber
    }

    useEffect(() => {
      if (commitWork) {
        commitWork()
      }
    })
  }, outDeps)
}