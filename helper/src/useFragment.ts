import { arrayNotEqual, Fiber, simpleNotEqual, useFiber, WithDraftFiber } from "better-react"

////////****类似函数式组件****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function useFragment(render: () => void, deps: readonly any[]): Fiber<FragmentProps> {
  return useFiber<FragmentProps>(Fragment, {
    render,
    deps
  }, fragmentShouldUpdate)
}
type FragmentProps = {
  render(): void
  deps: readonly any[]
}
function fragmentShouldUpdate<T>(newP: FragmentProps, oldP: FragmentProps) {
  return arrayNotEqual(oldP.deps, newP.deps, simpleNotEqual)
}
function Fragment(fiber: WithDraftFiber<FragmentProps>) {
  const { render } = fiber.draft.props
  render()
}