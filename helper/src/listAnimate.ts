import { EmptyFun, StoreRef, emptyFun, useGetFlushSync } from "better-react"
import { arrayEqual, useEffect } from "better-react"
import { createUseReducerFun } from "./useReducer"
import { useRef, useRefFun } from "./useRef"
import { createEmptyArray, getOutResolvePromise, removeWhere } from "./util"
import { renderArray } from "./renderMap"
import { useEvent } from "./useEvent"
export type AnimateRow<V> = {
  key: any
  value: V
  /**隐藏的不可见 */
  hide?: boolean
  resolve(v?: any): void
} & ({
  exiting?: never
} | {
  /**是否正在退出*/
  exiting: true
})

type AnimateExitModel<V> = {
  list: AnimateRow<V>[]
  removeVersion: number
}

/**
 * reducer里面的操作是可能被回滚与重复执行的
 * 所以不能在里面处理事件
 * 要准备好再提交加工
 * 包括监听,与禁止的处理
 * 只能在提交事件的地方.
 */
const useReducerAnimateExit = createUseReducerFun(function <V>(model: AnimateExitModel<V>, action: {
  method: "remove"
  key: any
} | {
  method: "change-list"
  list: AnimateRow<V>[]
  shouldAddRemoveVersion?: boolean,
  waitRemoveCacheList?: V[]
} | {
  method: "mark-show"
  keys: any[]
}) {
  if (action.method == 'remove') {
    return {
      ...model,
      list: model.list.filter(v => !(v.exiting && v.key == action.key)),
      removeVersion: model.removeVersion + 1
    }
  } else if (action.method == 'change-list') {
    return {
      ...model,
      removeVersion: action.shouldAddRemoveVersion
        ? model.removeVersion + 1
        : model.removeVersion,
      list: action.list
    }
  } else if (action.method == 'mark-show') {
    return {
      ...model,
      list: model.list.map(row => {
        if (row.hide && action.keys.includes(row.key)) {
          return {
            ...row,
            hide: false
          }
        }
        return row
      })
    }
  }
  return model
})


function callPromiseAll(promiseList: Promise<any>[], callback?: EmptyFun) {
  if (callback && promiseList.length) {
    Promise.all(promiseList).then(callback)
  }
}


function addIgnore<V>(v: V, list: Promise<any>[], xxIgnore?: (v: V) => boolean) {
  if (!xxIgnore?.(v)) {
    const [promise, resolve] = getOutResolvePromise()
    list.push(promise)
    return resolve
  }
  return emptyFun
}

function mergeAddList<V>(
  list: V[],
  keys: any[],
  getKey: (v: V) => any,
  newList: AnimateRow<V>[],
  promiseList: Promise<any>[],
  enterIgnore?: (v: V) => boolean,
  hide?: boolean,
  isShift?: boolean
) {
  let nextIndex = 0
  for (const v of list) {
    const key = getKey(v)
    const oldIndex = newList.findIndex(old => old.key == key)
    if (oldIndex < 0) {
      //新增
      if (isShift) {
        //如果删除是后退的,则一直加到不是删除为止
        while (newList[nextIndex]?.exiting) {
          nextIndex++
        }
      }

      keys.push(key)
      newList.splice(nextIndex, 0, {
        key,
        value: v,
        hide,
        resolve: addIgnore(v, promiseList, enterIgnore),
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
    onAnimateComplete,
    enterIgnore,
    exitIgnore
  }: {
    getKey(v: V): any
    mode?: 'wait' | 'pop' | 'shift'
    onExitComplete?(): void
    onAnimateComplete?(): void
    enterIgnore?(v: V): boolean
    exitIgnore?(v: V): boolean
  },
  render: (v: V, arg: AnimateRow<V>) => void
) {
  const [model, dispatch] = useReducerAnimateExit(function () {
    const promiseList: Promise<any>[] = []
    const data = {
      draftList: list,
      list: list.map(row => {
        return {
          key: getKey(row),
          value: row,
          resolve: addIgnore(row, promiseList, enterIgnore)
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
    //无副作用,只修补
    const caches = cacheRemoveKeys.get()
    if (caches.length) {
      const cacheList = lastTimeList.get()
      removeWhere(cacheList, v => caches.includes(getKey(v)))
      caches.length = 0
    }
  }, [model.removeVersion])
  useEffect(() => {
    mergeAddCacheList(lastTimeList, list, getKey)
    const lastList = lastRenderList.get()
    if (!arrayEqual(lastList, list, (a, b) => {
      return getKey(a) == getKey(b)
    })) {
      //每次都执行,直到改变才真执行
      lastRenderList.set(list)
      const newList = model.list.slice()
      const removePromiseList: Promise<any>[] = []
      //这次是否删除
      let shouldAddRemoveVersion = false
      for (let i = newList.length - 1; i > -1; i--) {
        //新列表未找到,标记为删除
        const old = newList[i]
        if (!old.exiting && !list.some(newV => getKey(newV) == old.key)) {
          const draftRow = lastTimeList.get().find(x => getKey(x) == old.key) || old.value
          if (!draftRow) {
            console.log("未找到,不可能", old)
          }
          if (exitIgnore?.(draftRow)) {
            //直接删除
            newList.splice(i, 1)
            cacheRemoveKeys.get().push(old.key)
            shouldAddRemoveVersion = true
          } else {
            //待删除  
            const [promise, resolve] = getOutResolvePromise()
            removePromiseList.push(promise)
            newList[i] = {
              ...old,
              exiting: true,
              value: draftRow,
              resolve() {
                //删除
                dispatch({
                  method: "remove",
                  key: old.key
                })
                cacheRemoveKeys.get().push(old.key)
                resolve(null)
              }
            }
          }
        }
      }
      const allPromiseList = removePromiseList.slice()
      const thisAddKeys: any[] = []
      mergeAddList(
        list,
        thisAddKeys,
        getKey,
        newList,
        allPromiseList,
        enterIgnore,
        //wait且有删除项,才标记为隐藏
        mode == 'wait' && !!removePromiseList.length,
        mode == 'shift')
      callPromiseAll(allPromiseList, onAnimateComplete)
      dispatch({
        method: "change-list",
        list: newList,
        shouldAddRemoveVersion,
      })
      if (removePromiseList.length) {
        //有删除项才有退出功能
        Promise.all(removePromiseList).then(function () {
          if (mode == 'wait' && thisAddKeys.length) {
            //当时为wait,且添加的keys存在
            dispatch({
              method: "mark-show",
              keys: thisAddKeys
            })
          }
          onExitComplete?.()
        })
      }
    }
  })

  renderArray(model.list.filter(filterShow), getPersenceKey, function (arg) {
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

function filterShow<V>(v: AnimateRow<V>) {
  return !v.hide
}

function getPersenceKey<V>(v: AnimateRow<V>) {
  return v.key
}


function mergeAddCacheList<V>(
  lastTimeList: StoreRef<V[]>,
  list: V[],
  getKey: (v: V) => any
) {

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
}