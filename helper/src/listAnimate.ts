import { EmptyFun } from "better-react"
import { arrayEqual, useEffect } from "better-react"
import { createUseReducerFun } from "./useReducer"
import { useRef, useRefFun } from "./useRef"
import { createEmptyArray, getOutResolvePromise, removeWhere } from "./util"
import { renderArray } from "./renderMap"
export type AnimateRow<V> = {
  key: any
  value: V
  resolve(v?: any): void
} & ({
  exiting?: never
} | {
  /**是否正在退出*/
  exiting: true
})

type AnimateExitModel<V> = {
  list: AnimateRow<V>[]
  getKey(v: V): any
  removeVersion: number
}
const useReducerAnimateExit = createUseReducerFun(function <V>(model: AnimateExitModel<V>, action: {
  method: 'in'
  list: V[]
  draftList: V[]
  onNoExit(): void
  onExitComplete(): void
  onAnimateComplete?(): void
  remove(v: any): void
  mode: 'wait' | 'shift' | 'pop'
} | {
  method: "remove"
  key: any
} | {
  method: "pure-in"
  list: V[]
  onAnimateComplete?(): void
}) {
  const getKey = model.getKey
  if (action.method == 'in') {
    const newList = model.list.slice()
    const promiseList: Promise<any>[] = []

    for (let i = 0; i < newList.length; i++) {
      //新列表未找到,标记为删除
      const old = newList[i]
      if (!old.exiting && !action.list.some(newV => getKey(newV) == old.key)) {
        const [promise, resolve] = getOutResolvePromise()
        promiseList.push(promise)
        const draftRow = action.draftList.find(x => getKey(x) == old.key) || old.value
        if (!draftRow) {
          console.log("未找到", old)
        }
        newList[i] = {
          ...old,
          exiting: true,
          value: draftRow,
          resolve() {
            action.remove(old.key)
            resolve(null)
          }
        }
      }
    }
    if (promiseList.length) {
      Promise.all(promiseList).then(action.onExitComplete)
    } else {
      action.onNoExit()
    }
    const allPromiseList = promiseList.slice()
    if (action.mode != 'wait') {
      mergeAddList(action.list, getKey, newList, allPromiseList, action.mode == 'shift')
      callPromiseAll(allPromiseList, action.onAnimateComplete)
    }
    return {
      ...model,
      list: newList
    }
  } else if (action.method == 'remove') {
    return {
      ...model,
      list: model.list.filter(v => !(v.exiting && v.key == action.key)),
      removeVersion: model.removeVersion + 1
    }
  } else if (action.method == "pure-in") {
    const newList = model.list.slice()
    const promiseList: Promise<any>[] = []
    mergeAddList(action.list, getKey, newList, promiseList)
    callPromiseAll(promiseList, action.onAnimateComplete)
    return {
      ...model,
      list: newList
    }
  }
  return model
})


function callPromiseAll(promiseList: Promise<any>[], callback?: EmptyFun) {
  if (callback && promiseList.length) {
    Promise.all(promiseList).then(callback)
  }
}


function mergeAddList<V>(
  list: V[],
  getKey: (v: V) => any,
  newList: AnimateRow<V>[],
  promiseList: Promise<any>[],
  isShift?: boolean
) {
  let nextIndex = 0
  for (const v of list) {
    const key = getKey(v)
    const oldIndex = newList.findIndex(old => old.key == key)
    if (oldIndex < 0) {
      //新增
      const [promise, resolve] = getOutResolvePromise()
      promiseList.push(promise)


      if (isShift) {
        //如果删除是后退的,则一直加到不是删除为止
        while (newList[nextIndex]?.exiting) {
          nextIndex++
        }
      }

      newList.splice(nextIndex, 0, {
        key,
        value: v,
        resolve,
      })
    } else {
      //下一步的位置
      nextIndex = oldIndex + 1
    }
  }
}
/**
 * 按理说有exitBeforeEnter,也应该有enterBeforeExit
 * 但增加后者就会冗余设计
 * @param iterable 
 * @param param1 
 * @param render 
 */
export function renderAnimateExit<V>(
  list: V[],
  {
    getKey,
    mode = 'shift',
    onExitComplete,
    onAnimateComplete
  }: {
    getKey(v: V): any
    mode?: 'wait' | 'pop' | 'shift'
    onExitComplete?(): void
    onAnimateComplete?(): void
  },
  render: (v: V, arg: AnimateRow<V>) => void
) {
  const [model, dispatch] = useReducerAnimateExit(function () {
    const promiseList: Promise<any>[] = []
    const data = {
      getKey,
      draftList: list,
      list: list.map(row => {
        const [promise, resolve] = getOutResolvePromise()
        promiseList.push(promise)
        return {
          key: getKey(row),
          value: row,
          resolve
        }
      }),
      removeVersion: 0
    }
    callPromiseAll(promiseList, onAnimateComplete)
    return data
  })
  const cacheRemoveKeys = useRefFun<any[]>(createEmptyArray)
  //缓存所有删除值,直到动画中的都被删除
  const lastTimeList = useRef(list)
  //用于每次数据更新的比较
  const lastRenderList = useRef(list)
  useEffect(() => {
    const caches = cacheRemoveKeys.get()
    if (caches.length) {
      const cacheList = lastTimeList.get()
      removeWhere(cacheList, v => caches.includes(getKey(v)))
      caches.length = 0
    }
  }, [model.removeVersion])

  useEffect(() => {
    const cacheList = lastTimeList.get()
    const newCacheList = list.slice()
    for (const cache of cacheList) {
      const cacheKey = getKey(cache)
      if (newCacheList.findIndex(v => getKey(v) == cacheKey) < 0) {
        //本次删除
        newCacheList.push(cache)
      }
    }
    lastTimeList.set(newCacheList)


    const lastList = lastRenderList.get()
    if (!arrayEqual(lastList, list, (a, b) => {
      return getKey(a) == getKey(b)
    })) {
      lastRenderList.set(list)
      const allIncome = () => {
        if (mode == 'wait') {
          dispatch({
            method: "pure-in",
            list,
            onAnimateComplete
          })
        }
      }
      dispatch({
        method: "in",
        list,
        onAnimateComplete,
        draftList: lastList,
        onExitComplete() {
          allIncome()
          onExitComplete?.()
        },
        onNoExit: allIncome,
        mode,
        remove(key) {
          dispatch({
            method: "remove",
            key
          })
          cacheRemoveKeys.get().push(key)
        },
      })
    }
  })

  renderArray(model.list, getPersenceKey, function (arg) {
    const getKey = model.getKey
    if (arg.exiting) {
      render(arg.value, arg)
    } else {
      const valueIdx = list.findIndex(v => getKey(v) == arg.key)
      if (valueIdx > -1) {
        //尽可能使用最新的值
        render(list[valueIdx], arg)
      } else {
        const lastIdx = lastTimeList.get().findIndex(v => getKey(v) == arg.key)
        if (lastIdx > -1) {
          console.log("没有找到现成的值,是因为正在被删除", arg)
          //没有找到,可能正在被删除
          render(arg.value, arg)
        } else {
          console.log("没有找到现成的值", arg)
          //没有找到,可能正在被删除
          render(arg.value, arg)
        }
      }
    }
  })
}

function getPersenceKey<V>(v: AnimateRow<V>) {
  return v.key
}
