import { EmptyFun, ReduceRowState, ReduceState, alawaysFalse, buildSubSetArray, buildSubSetObject } from "wy-helper"
import { useMemo } from "./useRef"
import { StoreValue, hookCreateChangeAtom } from "better-react"

/**
 * 对react-setState的局部嵌套
 * @param parentSet 
 * @param setChild 
 * @param getChild 
 * @param buildParent 
 */
export function useBuildSubSetObject<PARENT extends object, K extends keyof PARENT>(
  parentSet: ReduceState<PARENT>,
  key: K,
  callback?: (v: PARENT[K], parent: PARENT) => PARENT[K]
) {
  return useMemo(() => buildSubSetObject(parentSet, key, callback), [])
}

export function useBuildSubSetArray<T>(
  parentSet: ReduceState<T[]>,
  equal: ((v: T) => boolean)
): ReduceRowState<T> {
  return useMemo(() => buildSubSetArray(parentSet, equal), [])
}



class ArrayStoreValueCreater implements StoreValue {
  private array: any[] = []
  hookAddResult(...vs: readonly any[]): void {
    for (const v of vs) {
      this.array.push(v)
    }
  }
  private childrenDirty = hookCreateChangeAtom()(true, alawaysFalse)
  onRenderLeave(addLevelEffect: (level: number, set: EmptyFun) => void, parentResult: any) {
    if (this.childrenDirty.get()) {
      parentResult.childrenDirty.set(true)
    }
    return this.array
  }
}
export function arrayStoreCreater() {
  return new ArrayStoreValueCreater()
}

export function getArrayStoreCreater() {
  return arrayStoreCreater
}