import { useConstFrom, useDestroy } from "better-react-helper";
import { observerAnimateSignal } from "wy-dom-helper";
import { AnimateFrameSignalConfig, GetValue } from "wy-helper";

export function useObserverAnimateSignal(
  get: GetValue<number>,
  config?: AnimateFrameSignalConfig,
) {
  const [ret, destroy] = useConstFrom(() => observerAnimateSignal(get, config));
  useDestroy(destroy);
  return ret;
}
