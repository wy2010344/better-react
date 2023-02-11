import { createContext, useEffect, useMemo, useState } from "better-react"
import { RouteContext } from "better-react-helper"

/**
 * 简单的以/分割
 * @param path 
 * @returns 
 */
function simplePathNameToNodes(path: string) {
  return path.split('/').filter(v => v)
}
export type Navigate = {
  (n: number): void
  (path: string, arg?: {
    replace?: boolean
  }): void
}

export type ReadonlyURLSearchParams = Omit<URLSearchParams, 'append' | 'delete' | 'sort' | 'set'>
const NavigateContext = createContext<{
  navigate: Navigate
  searchParams: ReadonlyURLSearchParams
  hash: string
}>(null as any)

function getRouter(
  init: () => string,
  gotoPath: (path: string, replace?: boolean) => void,
  addReload: (
    reload: () => void
  ) => () => void
) {
  return function () {
    const [url, setUrl] = useState(init)
    const urlModel = useMemo(() => new URL(url), [url])
    const paths = useMemo(() => simplePathNameToNodes(urlModel.pathname), [urlModel.pathname])
    useEffect(() => {
      function reload() {
        setUrl(init())
      }
      return addReload(reload)
    }, [])
    const navigate: Navigate = function () {
      const [path, arg] = arguments as any
      if (typeof (path) == 'number') {
        if (path != 0) {
          history.go(path)
        }
      } else {
        gotoPath(path, arg?.replace)
        setUrl(init)
      }
    }
    NavigateContext.useProvider({
      navigate,
      searchParams: urlModel.searchParams,
      hash: urlModel.hash
    })
    RouteContext.useProvider({
      paths,
      getPrefix() {
        return []
      },
    })
    return {
      searchParams: urlModel.searchParams,
      hash: urlModel.hash,
      navigate,
      paths
    }

  }
}

export function useNavigate() {
  return NavigateContext.useConsumer()
}

export const useBrowserRouter = getRouter(
  () => location.href,
  (path, replace) => {
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