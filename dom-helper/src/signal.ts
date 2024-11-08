import { useConstFrom, useDestroy, useMemo } from "better-react-helper";
import { animateFrame } from "wy-dom-helper";
import { createAnimateSignal, defaultSpringBaseAnimationConfig, GetDeltaXAnimationConfig, GetValue } from "wy-helper";

export function useAnimateSignal(get: GetValue<number>, config: GetDeltaXAnimationConfig = defaultSpringBaseAnimationConfig) {
  const [ret, destroy] = useConstFrom(() => createAnimateSignal(animateFrame, get, config))
  useDestroy(destroy)
  return ret
}