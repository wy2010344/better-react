export function generateHook() {
  return function Hook({
    children
  }: {
    children: () => JSX.Element
  }) {
    return children()
  }
}
export const Hook = generateHook()