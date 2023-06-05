import { useRefFun } from "./useRef";

/**
 * 需要应对draft态
 * 即需要rollback.
 * 因为rollback后,render还是同一个
 * 
 * 只是对应单个函数,如果对应多个函数,就是Map,需要直接useRefConst
 * @param fun 
 * @returns 
 */
export function useEvent<T extends (...vs: any[]) => any>(fun: T): T {
  const ref = useRefFun(delegateFun).get()
  ref.setCurrent(fun)
  return ref.run as T
}

function delegateFun<T extends (...vs: any[]) => any>() {
  let current: T
  const run = (...vs: any[]) => {
    return current(...vs)
  }
  return {
    setCurrent(f: T) {
      current = f
    },
    run
  }
}