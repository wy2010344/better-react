import { Fiber, useFiber, WithDraftFiber } from "better-react"

////////****类似函数式组件****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function useFragment(fun: () => void): Fiber<FragmentProps<void>>
export function useFragment<T>(fun: (v: T) => void, v: T): Fiber<FragmentProps<T>>;
export function useFragment<T>(fun: (v?: T) => void, v?: T): Fiber<FragmentProps<T>> {
  return useFiber<FragmentProps<T>>(Fragment, { call: fun, args: v }, fragmentShouldUpdate)
}
type FragmentProps<T> = {
  call(v?: T): void
  args?: T
} | {
  call(v: T): void
  args: T
}
function fragmentShouldUpdate<T>(newP: FragmentProps<T>, oldP: FragmentProps<T>) {
  return newP.call != oldP.call || newP.args != oldP.args
}
function Fragment<T>(fiber: WithDraftFiber<{
  call(v?: T): void
  args?: T
}>) {
  const { call, args } = fiber.draft.props
  call(args)
}