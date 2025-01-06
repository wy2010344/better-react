import { useConstFrom, useDestroy } from "better-react-helper";
import { animateFrame } from "wy-dom-helper";
import { AnimateFrameSignalConfig, createAnimateSignal, GetValue } from "wy-helper";

export function useAnimateSignal(get: GetValue<number>, config?: AnimateFrameSignalConfig) {
  const [ret, destroy] = useConstFrom(() => createAnimateSignal(animateFrame, get, config))
  useDestroy(destroy)
  return ret
}