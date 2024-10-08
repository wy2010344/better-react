import { useEffect } from "better-react-helper"
import { useMemo, useChangeFun } from "better-react-helper"
import { emptyArray } from "wy-helper"
import { getPathNodes } from "wy-helper/router"

export type Navigate<T extends string = string> = {
  (n: number): void
  (path: T, arg?: {
    replace?: boolean
  }): void
}

export type ReadonlyURLSearchParams = Omit<URLSearchParams, 'append' | 'delete' | 'sort' | 'set'>
/**
 * 一使满足编程里的类型,需要全局设置一个state的context,它的值是由这个router的结果而来,设值则转化为具体的url去navigate,setState带的第二个参数是replace
 * 如果需要强刷新,需要将状态反映到url里,如version.否则是幂等不改变,但由于是动作,会记录到历史里.
 * 在原生中由于自己维护历史,当然是一个弹窗系统
 * 
 * 只对观测最新的url状态,无法确认url状态是用push/pop或什么而来的
 * 事实上可以通过history.length知道一些,如果增加则是push,如果没增加,可能是back或replace
 * @param init 
 * @param gotoPath 
 * @param addReload 
 * @returns 
 */
function getRouter(
  init: () => string,
  gotoPath: (path: string, replace?: boolean) => void,
  addReload: (
    reload: () => void
  ) => () => void
) {
  return function () {
    //不能是列表,因为返回的非幂等
    const [url, setUrl] = useChangeFun(init)
    const urlModel = useMemo(() => new URL(url), url)
    const paths = useMemo(() => getPathNodes(decodeURI(urlModel.pathname)), urlModel.pathname)
    useEffect(() => {
      function reload() {
        setUrl(init())
      }
      return addReload(reload)
    }, emptyArray)
    const navigate: Navigate = function () {
      const [path, arg] = arguments as any
      if (typeof (path) == 'number') {
        if (path != 0) {
          history.go(path)
        }
      } else {
        gotoPath(path, arg?.replace)
        //pushState/replaceState不触发url变化,而hashChange始终会触发变化
        setUrl(init())
      }
    }
    return {
      searchParams: urlModel.searchParams,
      hash: urlModel.hash,
      navigate,
      paths
    }
  }
}

export type RouterReturn = ReturnType<typeof useBrowserRouter>
export const useBrowserRouter = getRouter(
  () => location.href,
  (path, replace) => {
    //并不会触发
    if (replace) {
      history.replaceState(null, '', path)
    } else {
      history.pushState(null, '', path)
    }
  },
  reload => {
    window.addEventListener("popstate", reload)
    return () => {
      window.removeEventListener("popstate", reload)
    }
  }
)
export const useHashRouter = getRouter(
  () => location.origin + "/" + location.hash.slice(1),
  (path, replace) => {
    const absolutePath = location.pathname + "#" + path
    if (replace) {
      history.go(-1)
    }
    location.href = absolutePath
  },
  reload => {
    window.addEventListener("hashchange", reload)
    return () => {
      window.removeEventListener("hashchange", reload)
    }
  }
)