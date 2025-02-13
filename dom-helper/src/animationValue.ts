import { useMemo } from "better-react-helper";
import { animateFrame, signalAnimateFrame } from "wy-dom-helper";
import { emptyArray } from "wy-helper";

export function useAnimateFrame(n: number) {
  return useMemo(() => animateFrame(n), emptyArray)
}
export function useSignalAnimateFrame(n: number) {
  return useMemo(() => signalAnimateFrame(n), emptyArray)
}