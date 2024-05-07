import { useEffect, useEvent, useMemo } from "better-react-helper";
import { subscribeRequestAnimationFrame } from "wy-dom-helper";
import { edgeScrollChange, EdgeScrollConfig, Point, emptyArray, emptyObject } from "wy-helper";


export function useEdgeScroll(
  getPoint: () => Point | undefined,
  getContainer: () => HTMLElement,
  config: EdgeScrollConfig,
  arg: {
    disabled?: boolean
    scrollDiffLeft?(d: number): void
    scrollDiffTop?(d: number): void
  } = emptyObject
) {
  useEffect(() => {
    if (!arg.disabled) {
      return subscribeRequestAnimationFrame(function () {
        const container = getContainer()
        const point = getPoint()
        if (point) {
          edgeScrollChange(point, () => container.getBoundingClientRect(), config, function (dir, diff) {
            if (dir == 'left') {
              container.scrollLeft += diff
              arg.scrollDiffLeft?.(diff)
            } else if (dir == 'top') {
              container.scrollTop += diff
              arg.scrollDiffTop?.(diff)
            }
          })
        }
      })
    }
  }, [!arg.disabled])
}