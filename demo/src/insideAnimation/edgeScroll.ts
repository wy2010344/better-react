import { useAtom, useEffect, useMemo } from "better-react-helper";
import { subscribeRequestAnimationFrame } from "wy-dom-helper";
import { EdgeScroll, EdgeScrollBox, EdgeScrollConfig, Point, emptyArray, emptyObject } from "wy-helper";







type PureEdgeScrollCfg = {
  padding: number
}
type EdgeScrollCfg = PureEdgeScrollCfg | boolean

type EdgeScrollDirection = {
  min?: EdgeScrollCfg
  max?: EdgeScrollCfg
} | boolean

function getCfg(padding: number, dir: 'min' | 'max', M?: EdgeScrollDirection): PureEdgeScrollCfg | void {
  if (M == true) {
    return {
      padding
    }
  }
  if (typeof M == 'object' && M[dir]) {
    const MDir = M[dir]
    if (MDir == true) {
      return {
        padding
      }
    }
    if (typeof MDir == 'object') {
      return {
        padding: MDir.padding
      }
    }
  }
}
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