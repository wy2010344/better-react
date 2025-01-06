
import { addEffectDestroy, useAtom, useEffect, useHookEffect } from "better-react-helper"
import { moveEdgeScroll, PagePoint, subscribeDragMove, subscribeMove } from "wy-dom-helper"
import { ReorderAction, ReorderModel, ReorderElement, easeFns, messageChannelCallback, getTweenAnimationConfig } from "wy-helper"



export function useReducerReorder<T, K>(
  value: ReorderModel<T, K>,
  dispatch: (v: ReorderAction<K, HTMLElement>) => void,
) {
  const movePoint = useAtom<PagePoint | undefined>(undefined)
  return {
    start(e: PagePoint, key: K, container: HTMLElement) {
      movePoint.set(e)
      dispatch({
        type: "moveBegin",
        key,
        point: e.pageY,
        scrollTop: container.scrollTop
      })
    },
    onScroll(
      container: HTMLElement,
      elements: ReorderElement<K, HTMLElement>[]
    ) {
      const mp = movePoint.get()
      if (mp) {
        dispatch({
          type: "didMove",
          version: value.version,
          point: mp.pageY,
          elements,
          scrollTop: container.scrollTop
        })
        return true
      }
    },
    useBody(
      container: HTMLElement,
      getElements: () => ReorderElement<K, HTMLElement>[]
    ) {
      useHookEffect(() => {
        //不依赖,每次重新注册
        addEffectDestroy(subscribeDragMove(function (e) {
          if (movePoint.get()) {
            if (e) {
              moveEdgeScroll(e.pageY, {
                direction: "y",
                container,
                config: {
                  padding: 10,
                  config: true
                }
              })
              movePoint.set(e)
              dispatch({
                type: "didMove",
                version: value.version,
                point: e.pageY,
                elements: getElements(),
                scrollTop: container.scrollTop
              })
            } else {
              movePoint.set(undefined)
              dispatch({
                type: "end",
                version: value.version,
                // point: e.pageY,
                elements: getElements(),
                scrollTop: container.scrollTop,
                getConfig: endConfig
              })
            }
          }
        }))
      })


      const hasEnd = value.onMove?.endAt
      useEffect(() => {
        if (hasEnd) {
          messageChannelCallback(() => {
            dispatch({
              type: "didEnd",
              scrollTop: container.scrollTop,
              elements: getElements(),
              getConfig: endConfig,
              version: value.version
            })
          })
        }
      }, [hasEnd])
    }
  }
}

const endConfig = getTweenAnimationConfig(400, easeFns.out(easeFns.circ))