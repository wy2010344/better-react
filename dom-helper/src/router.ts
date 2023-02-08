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
  toAbsoluteUrl: (path: string) => string,
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
        const absoluteUrl = toAbsoluteUrl(path)
        if (arg?.replace) {
          history.replaceState(null, '', absoluteUrl)
        } else {
          history.pushState(null, '', absoluteUrl)
        }
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
  path => path,
  reload => {
    window.addEventListener("popstate", reload)
    return () => {
      window.removeEventListener("popstate", reload)
    }
  }
)
export const useHashRouter = getRouter(
  () => location.origin + "/" + location.hash.slice(1),
  path => location.pathname + "#" + path,
  reload => {
    window.addEventListener("hashchange", reload)
    return () => {
      window.removeEventListener("hashchange", reload)
    }
  }
)