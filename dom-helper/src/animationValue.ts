import { useMemo } from "better-react-helper";
import { animateNumberFrame, animateColorFrame, } from "wy-dom-helper";
import { BGColor, emptyArray } from "wy-helper";

export function useAnimationFrameNumber(n: number) {
  return useMemo(() => animateNumberFrame(n), emptyArray)
}


export function useAnimationFrameColor(color: BGColor) {
  return useMemo(() => animateColorFrame(color), emptyArray)
}