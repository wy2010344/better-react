import { useMemo } from "better-react-helper";
import { animateFrame } from "wy-dom-helper";
import { emptyArray } from "wy-helper";

export function useAnimateFrame(n: number) {
  return useMemo(() => animateFrame(n), emptyArray)
}