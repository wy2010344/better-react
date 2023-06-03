import { notEqualChange, ShouldChange, valueOf } from "./Vue";
import { useRefFun } from "./useRef";


export function useRefVueValueFrom<T>(init: () => T, shouldChange?: ShouldChange<any>) {
  return useRefFun(() => valueOf(init(), shouldChange)).get()
}
export function useRefVueValue<T>(init: T, shouldChange?: ShouldChange<any>) {
  return useRefVueValueFrom(() => init, shouldChange)
}

export function useRefAtomVueValueFrom<T>(init: () => T, shouldChange: ShouldChange<any> = notEqualChange) {
  return useRefFun(() => valueOf(init(), shouldChange)).get()
}
export function useRefAtomVueValue<T>(init: T, shouldChange: ShouldChange<any> = notEqualChange) {
  return useRefVueValueFrom(() => init, shouldChange)
}