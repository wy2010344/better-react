import { useEvent } from "./useEvent"
import { useMemo } from "./useRef"
import { useRefState, useStoreTriggerRender } from "./useRefState"
import { useValueCenterFun } from "./ValueCenter"

export type LoadAfterResult<T, K> = {
  list: T[]
  nextKey: K
  hasMore: boolean
}
export type LoadData<T, K> = {
  version: number
  list: T[]
  nextKey: K
  hasMore: boolean
}
function debugLog(...vs: any[]) {
  //console.log.apply(console, vs)
}
export function useAutoPageLoadMore<T, K, P>({
  initFlag,
  loadAfter,
  keyEqual = simpleKeyEqual
}: {
  initFlag: K,
  /**
   * 需要准实时的东西
   * 如果条件控制,条件要最新的.
   */
  loadAfter(key: K, arg: P, isInit?: boolean): Promise<LoadAfterResult<T, K>>,
  keyEqual?(a: K, b: K): boolean
}) {
  const [version, setVersion, getVersion] = useRefState<{
    version: number
    arg: P
  }>({
    arg: null as unknown as P,
    version: 0
  })
  const dataCenter = useValueCenterFun<LoadData<T, K>>(() => ({
    version: version.version,
    list: [],
    nextKey: initFlag,
    hasMore: false
  }))
  /**
   * 随时发起,皆生效,每次增大一个版本号
   */
  const reload = useMemo(() => (arg: P, wherError?: (err: any) => void) => {
    const oldVersion = getVersion()
    const newVersion = oldVersion.version + 1
    setVersion({
      version: newVersion,
      arg
    })
    loadAfter(initFlag, arg, true).then(res => {
      if (getVersion().version != newVersion) {
        debugLog("版本号不同,放弃更新", getVersion(), newVersion)
        return
      }
      dataCenter.set({
        ...res,
        version: newVersion,
      })
    }).catch(err => {
      debugLog("出现错误", err)
      if (getVersion().version != newVersion) {
        debugLog("版本号不同,放弃更新--error", getVersion(), newVersion)
        return
      }
      wherError?.(err)
      setVersion(oldVersion)
    })
    return newVersion
  }, [])

  const [loadMoreFlag, setLoadMoreFlag, getLoadMoreFlag] = useRefState<{
    key: K,
    version: number
  }>({
    key: initFlag,
    version: version.version
  })

  function isLoadMore(flag: typeof loadMoreFlag, data: LoadData<T, K>) {
    //flag不存在,可以进入
    //flag存在,但version不同,可以进入
    //flag存在,version相同,但id不同,可以进入
    //后两种依赖的是已经生效的data
    return flag.version == data.version && keyEqual(data.nextKey, flag.key)
  }

  /**
   * 随时发起,但生效有条件
   * 1.有数据时(依当前数据)
   * 2.不在重新加载中(当前数据版本号和最新版本号一致)
   * 3.同类型请求不能重复(非同类型请求可以重复:同版本号不允许重复)
   * 4.定义本次锚点:版本号+lastFlag
   * 
   * 5.回调检查:有刷新(版本号不同),不能进入
   *   无刷新,但lastFlag不同(不存在,因为无法进入)
   */
  const loadMore = useEvent((wherError?: (err: any) => void) => {
    const data = dataCenter.get()
    if (getVersion().version != data.version) {
      //正在全局刷新中,data设置生效后才能用
      debugLog("版本号不同停止", getVersion(), data.version)
      return
    }
    if (keyEqual(data.nextKey, initFlag)) {
      debugLog("未初始化,禁止加载")
      return
    }
    const oldFlag = getLoadMoreFlag()
    if (isLoadMore(oldFlag, data)) {
      debugLog("重复触发loadMore", oldFlag.version, data.version, '-----', oldFlag.key, data.nextKey)
      return
    }
    if (!data.hasMore) {
      debugLog("没有更多数据")
      return
    }
    const newFlag = {
      version: version.version,
      key: data.nextKey
    }
    setLoadMoreFlag(newFlag)
    loadAfter(data.nextKey, version.arg).then(res => {
      if (getVersion().version != newFlag.version) {
        debugLog("版本号变化停止", getVersion(), newFlag.version)
        //有新的异步请求
        return
      }
      dataCenter.set({
        ...data,
        ...res,
        list: data.list.concat(res.list)
      })
    }).catch(err => {
      debugLog("出现错误", err)
      if (getVersion().version != newFlag.version) {
        debugLog("版本号变化停止--error", getVersion(), newFlag.version)
        //有新的异步请求
        return
      }
      wherError?.(err)
      setLoadMoreFlag(oldFlag)
    })
    return true
  })
  const data = useStoreTriggerRender(dataCenter)
  //视图上展示是否在加载上
  const viewReloading = useMemo(() => {
    return !(version.version == data.version)
  }, [version, data.version])
  //在视图上是否是重新加载
  const viewLoadingMore = useMemo(() => {
    return !keyEqual(data.nextKey, initFlag) && !viewReloading && isLoadMore(loadMoreFlag, data)
  }, [data, loadMoreFlag, viewReloading])
  return {
    setData(fun: T[] | ((list: T[]) => T[])) {
      if (typeof (fun) == 'function') {
        dataCenter.set(data => {
          return {
            ...data,
            list: fun(data.list)
          }
        })
      } else {
        dataCenter.set({
          ...data,
          list: fun
        })
      }
    },
    data,
    dataCenter,
    //只供视图使用,正在加载中
    reloading: viewReloading,
    //重新加载请求
    reload,
    loadMore,
    //只供视图使用,正在加载更多,与重新加载互斥
    loadMoreing: viewLoadingMore
  }
}
export function observerIntersection(
  callback: IntersectionObserverCallback,
  flag: Element,
  options?: IntersectionObserverInit
) {
  const observer = new IntersectionObserver(callback, options)
  observer.observe(flag)
  return function () {
    observer.unobserve(flag)
    observer.disconnect()
  }
}

export function simpleKeyEqual<T>(a: T, b: T) {
  return a == b
}