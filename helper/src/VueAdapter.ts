import { notEqualChange, ShouldChange, valueOf } from "wy-helper/Vue";
import { useAtomBindFun } from "./useRef";


export function useRefVueValueFrom<T>(init: () => T, shouldChange?: ShouldChange<any>) {
  return useAtomBindFun(() => valueOf(init(), shouldChange)).get()
}
export function useRefVueValue<T>(init: T, shouldChange?: ShouldChange<any>) {
  return useRefVueValueFrom(() => init, shouldChange)
}

export function useRefAtomVueValueFrom<T>(init: () => T, shouldChange: ShouldChange<any> = notEqualChange) {
  return useAtomBindFun(() => valueOf(init(), shouldChange)).get()
}
export function useRefAtomVueValue<T>(init: T, shouldChange: ShouldChange<any> = notEqualChange) {
  return useRefVueValueFrom(() => init, shouldChange)
}