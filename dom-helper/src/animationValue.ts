import { useMemo } from "better-react-helper";
import { animateSignal } from "wy-dom-helper";
import { emptyArray } from "wy-helper";

export function useAnimateSignal(n: number) {
  return useMemo(() => animateSignal(n), emptyArray);
}
