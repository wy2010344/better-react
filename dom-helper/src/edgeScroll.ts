import { useEffect, useMemo } from "better-react-helper";
import { subscribeRequestAnimationFrame } from "wy-dom-helper";
import { EdgeScroll, EdgeScrollConfig, Point, emptyArray, emptyObject } from "wy-helper";

export function useEdgeScroll(
  getContainer: () => HTMLElement,
  config: EdgeScrollConfig,
  arg: {
    disabled?: boolean
    scrollDiffLeft?(d: number): void
    scrollDiffTop?(d: number): void
  } = emptyObject
) {
  const edgeScroll = useMemo(() => new EdgeScroll(), emptyArray)
  useEffect(() => {
    if (!arg.disabled) {
      return subscribeRequestAnimationFrame(function () {
        const container = getContainer()
        edgeScroll.change(() => container.getBoundingClientRect(), config, function (dir, diff) {
          if (dir == 'left') {
            container.scrollLeft += diff
            arg.scrollDiffLeft?.(diff)
          } else if (dir == 'top') {
            container.scrollTop += diff
            arg.scrollDiffTop?.(diff)
          }
        })
      })
    }
  }, [!arg.disabled])
  /**
   * 光标落处
   */
  return function (point?: Point) {
    edgeScroll.setPoint(point)
  }
}