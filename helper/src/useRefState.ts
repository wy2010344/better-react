import { useRef } from './useRef'
import { useChange } from './useState'
import { useCallback } from './useCallback'
import { emptyArray } from 'better-react'
type RefState<T> = [T, (v: T) => void, () => T]
export function useRefState<T, M>(init: M, trans: (v: M) => T): RefState<T>
export function useRefState<T>(init: T): RefState<T>
export function useRefState() {
  const [init, trans] = arguments
  const [state, setState] = useChange(init, trans)
  const lock = useRef(state)

  const setValue = useCallback((value) => {
    if (value != lock.get()) {
      lock.set(value)
      setState(value)
    }
  }, emptyArray)
  return [state, setValue, lock.get]
}
// export function useRefState<T>(): RefState<T | undefined>
// export function useRefState<T>(init: T | (() => T), arg?: RefStateProps<T>): RefState<T>
// export function useRefState<T, M>(init: M, arg: RefStatePropsWithTrans<T, M>): RefState<T>
// export function useRefState() {
//   const get = ref.get
//   const newArg = useAlways(arg)
//   const set = useMemo(, [])
//   return [state, set, get, newArg] as const
// }

// export function useBaseRefState(init,trans) {
//   const [state, setState] = typeof (init) == 'function' ? useChangeFun(init) : useChange<any, any>(init, trans)
//   const ref = useRef(state)
//   return [
//     state,
//     function(arg){
//       toReduceState(value => {
//         const isChange = arg?.isChange || defaultIsChange
//         if (isChange(value, ref.get())) {
//           ref.set(value)
//           setState(value)
//           //在内容生效后调用
//           arg?.onChange?.(value)
//         }
//         //都需要在内容生效后调用
//         arg?.onSet?.(value)
//       }, ref.get)
//     } , 
//     ref.get
//   ]
// }