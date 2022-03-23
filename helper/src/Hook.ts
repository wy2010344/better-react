export function generateHook() {
  return function Hook<T>({
    children
  }: {
    children: () => T
  }) {
    return children()
  }
}
export const Hook = generateHook()