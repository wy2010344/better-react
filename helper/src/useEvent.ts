import { useRefValue } from "./useRef";

export function useEvent<T extends (...vs: any[]) => any>(fun: T): T {
  const ref = useRefValue(delegateFun)()
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