import { arrayNotEqual, Fiber, simpleNotEqual, useFiber, WithDraftFiber } from "better-react"

////////****类似函数式组件****////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * 一定有deps,如果没有deps,则不是优化,为什么还要使用useFragment包一层
 * @param render 
 * @param deps 
 */
export function useFragment<T extends readonly any[] = any[]>(render: (...args: T) => void, deps: T): void
export function useFragment(render: () => void, deps: readonly any[]): Fiber<FragmentProps>
export function useFragment(render: any, deps: readonly any[]) {
  return useFiber<FragmentProps>(Fragment, {
    render,
    deps
  }, fragmentShouldUpdate)
}
type FragmentProps = {
  render(...vs: any[]): void
  deps: readonly any[]
}
function fragmentShouldUpdate(newP: FragmentProps, oldP: FragmentProps) {
  return arrayNotEqual(oldP.deps, newP.deps, simpleNotEqual)
}
function Fragment(fiber: WithDraftFiber<FragmentProps>) {
  const { render, deps } = fiber.draft.props
  render(...deps)
}