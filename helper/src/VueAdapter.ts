import { useRefValue } from "better-react";
import { notEqualChange, ShouldChange, valueOf } from "./Vue";



export function useRefVueValueFrom<T>(init: () => T, shouldChange?: ShouldChange<any>) {
  return useRefValue(() => valueOf(init(), shouldChange))()
}
export function useRefVueValue<T>(init: T, shouldChange?: ShouldChange<any>) {
  return useRefVueValueFrom(() => init, shouldChange)
}

export function useRefAtomVueValueFrom<T>(init: () => T, shouldChange: ShouldChange<any> = notEqualChange) {
  return useRefValue(() => valueOf(init(), shouldChange))()
}
export function useRefAtomVueValue<T>(init: T, shouldChange: ShouldChange<any> = notEqualChange) {
  return useRefVueValueFrom(() => init, shouldChange)
}