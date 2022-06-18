import { useRefValue } from "./useRef";

/**
 * 需要应对draft态
 * 即需要rollback.
 * 因为rollback后,render还是同一个
 * @param fun 
 * @returns 
 */
export function useEvent<T extends (...vs: any[]) => any>(fun: T): T {
  const ref = useRefValue(delegateFun).get()
  ref.setCurrent(fun)
  return ref.run as T
}

function delegateFun<T extends (...vs: any[]) => any>() {
  let current: T
  const run: T = function () {
    return current.apply(null, arguments as any)
  } as T
  return {
    setCurrent(f: T) {
      current = f
    },
    run
  }
}