import { useChgAtomFun } from "./useRef"
import { useVersion } from "./useVersion"
import { ArrayHelper, createEmptyArray, getOutResolvePromise, removeWhere } from "./util"
import { renderArray } from "./renderMap"
import { emptyArray } from "better-react"
import { useEffect } from "./useEffect"





export interface ExitModel<V> {
  value: V
  key: any
  enterIgnore?: boolean
  exiting?: boolean
  promise: Promise<any>
  resolve(v?: any): void
}

interface ExitModelImpl<V> extends ExitModel<V> {
  hide?: boolean
  needCollect: boolean
}



/**
 * 主要是有一点,可能会回退
 */
export type ExitAnimateMode = 'pop' | 'shift' | 'wait'

export type RenderAnimateConfig<V> = {
  mode?: ExitAnimateMode
  exitIgnore?(v: V): any
  enterIgnore?(v: V): any
  onExitComplete?(): void
  onEnterComplete?(): void
  onAnimateComplete?(): void
}
export function useRenderExitAnimate<V>(
  list: readonly V[],
  getKey: (v: V) => any,
  {
    mode = 'shift',
    exitIgnore,
    onExitComplete,
    onEnterComplete,
    enterIgnore,
    onAnimateComplete
  }: RenderAnimateConfig<V>
) {
  //用于删除后强制刷新
  const [_, updateVersion] = useVersion()
  //每次render进来,合并cacheList
  const cacheList = useChgAtomFun<ExitModelImpl<V>[]>(createEmptyArray)
  const newCacheList = new ArrayHelper(cacheList.get())
  let destroyCount = 0
  for (let i = newCacheList.get().length - 1; i > -1; i--) {
    //新列表未找到,标记为删除
    const old = newCacheList.get()[i]
    if (!old.exiting && !list.some(v => getKey(v) == old.key)) {
      //新删除了
      if (exitIgnore?.(old.value)) {
        newCacheList.removeAt(i)
      } else {
        destroyCount++
        const [promise, resolve] = getOutResolvePromise()
        newCacheList.replace(i, {
          ...old,
          needCollect: true,
          exiting: true,
          promise,
          resolve,
        })
      }
    }
  }
  let nextIndex = 0
  for (const v of list) {
    const key = getKey(v)
    const oldIndex = newCacheList.get().findIndex(old => old.key == key)
    if (oldIndex < 0) {
      if (mode == 'shift') {
        while (newCacheList.get()[nextIndex]?.exiting) {
          nextIndex++
        }
      }
      const [promise, resolve] = getOutResolvePromise()
      newCacheList.insert(nextIndex, {
        value: v,
        key,
        hide: mode == 'wait' && destroyCount != 0,
        needCollect: true,
        enterIgnore: enterIgnore?.(v),
        promise,
        resolve
      })
    } else {
      newCacheList.replace(oldIndex, {
        ...newCacheList.get()[oldIndex],
        value: v
      })
      nextIndex = oldIndex + 1
    }
  }
  cacheList.set(newCacheList.get() as ExitModelImpl<V>[])

  useEffect(() => {
    const destroyPromises: Promise<any>[] = []
    const thisAddList: ExitModel<any>[] = []
    for (const cache of cacheList.get()) {
      if (cache.needCollect) {
        cache.needCollect = false
        if (cache.exiting) {
          cache.promise.then(function () {
            const n = removeWhere(cacheList.get(), function (v, i) {
              return v.key == cache.key && v.exiting && v.promise == cache.promise
            })
            if (n) {
              updateVersion()
            }
          })
          destroyPromises.push(cache.promise)
        } else {
          thisAddList.push(cache)
        }
      }
    }
    if (destroyPromises.length && onExitComplete) {
      const allDestroyPromise = Promise.all(destroyPromises)
      allDestroyPromise.then(onExitComplete)
      if (mode == 'wait' && thisAddList.length != 0) {
        allDestroyPromise.then(function () {
          //将本次更新全部标记为展示.
          let n = 0
          for (const cache of cacheList.get()) {
            if (cache.hide) {
              const thisAdd = thisAddList.find(v => v.key == cache.key && v.promise == cache.promise)
              if (thisAdd) {
                cache.hide = false
                n++
              }
            }
          }
          if (n) {
            updateVersion()
          }
        })
      }
    }
    if (onEnterComplete) {
      const enterPromises: Promise<any>[] = []
      for (const add of thisAddList) {
        if (!enterIgnore?.(add.value)) {
          enterPromises.push(add.promise)
        }
      }
      if (enterPromises.length) {
        Promise.all(enterPromises).then(onEnterComplete)
      }
    }
    if (onAnimateComplete) {
      const promiseAll = destroyPromises.slice()
      for (const add of thisAddList) {
        if (!enterIgnore?.(add.value)) {
          promiseAll.push(add.promise)
        }
      }
      if (promiseAll.length) {
        Promise.all(promiseAll).then(onAnimateComplete)
      }
    }
  })
  return newCacheList.get().filter(getNotHide) as ExitModel<V>[]
}

export function renderExitAnimate<V>(
  list: readonly V[],
  getKey: (v: V) => any,
  args: RenderAnimateConfig<V>,
  render: (v: ExitModel<V>) => void
) {
  const newList = useRenderExitAnimate(list, getKey, args)
  renderArray(newList, getKen, function (value) {
    render(value)
  })
}

function getNotHide(v: ExitModelImpl<any>) {
  return !v.hide
}

function getKen<V>(v: ExitModel<V>) {
  return v.key
}

function onlyGetArray(v: any) {
  return v
}
function ignoreTrue() {
  return true
}


const onlyArray = [1]
/**
 * 只有一个元素的
 */
export function renderOneExitAnimate(
  show: any,
  {
    ignore,
    ...args
  }: {
    ignore?: boolean
    onAnimateComplete?(): void
  },
  render: (v: ExitModel<any>) => void
) {
  renderExitAnimate(
    show ? onlyArray : emptyArray,
    onlyGetArray,
    {
      enterIgnore: show && ignore ? ignoreTrue : undefined,
      exitIgnore: !show && ignore ? ignoreTrue : undefined,
      ...args
    },
    render
  )
}