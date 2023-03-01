import { createContext } from "better-react"
import { RouteContext } from "better-react-helper"
import { Navigate, ReadonlyURLSearchParams } from "./router-base"

const NavigateContext = createContext<{
  navigate: Navigate
  searchParams: ReadonlyURLSearchParams
  hash: string
}>(null as any)

export function useNavigate() {
  return NavigateContext.useConsumer()
}

export function useNestRouterProvider(
  navigate: Navigate,
  searchParams: ReadonlyURLSearchParams,
  hash: string,
  paths: string[]
) {
  NavigateContext.useProvider({
    navigate,
    searchParams,
    hash
  })
  RouteContext.useProvider({
    paths,
    getPrefix() {
      return []
    },
  })
}