import { addEffectDestroy, useAtom, useEffect, useHookEffect, useStoreTriggerRender } from "better-react-helper"
import { ReorderLocalAction, ReorderLocalElement, ReorderLocalModel, ValueCenter, easeFns, emptyArray, getTweenAnimationConfig, messageChannelCallback, reorderLocalReducer } from "wy-helper"
import { ReorderAction, ReorderElement, ReorderModel, } from "wy-helper"
import { PagePoint, subscribeDragMove, subscribeEdgeScroll, subscribeMove } from "wy-dom-helper"




export function userReducerLocalChangeReorder<K>(
  version: number,
  vc: ValueCenter<ReorderLocalModel<K>>
) {
  const movePoint = useAtom<PagePoint | undefined>(undefined)
  function dispatch(action: ReorderLocalAction<K>) {
    vc.set(reorderLocalReducer(vc.get(), action))
  }
  // vc.get().onMove?.info?.lastPoint
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
      elements: ReorderLocalElement<K>[]
    ) {
      const mp = movePoint.get()
      if (mp) {
        dispatch({
          type: "didMove",
          version: version,
          point: mp.pageY,
          elements,
          scrollTop: container.scrollTop
        })
        return true
      }
    },
    useBody(
      container: HTMLElement,
      getElements: () => ReorderLocalElement<K>[]
    ) {
      useHookEffect(() => {
        addEffectDestroy(subscribeEdgeScroll(() => {
          const info = movePoint.get()
          if (info) {
            return {
              point: info.pageY,
              direction: "y",
              container,
              config: {
                padding: 10,
                config: true
              }
            }
          }
        }))
        //不依赖,每次重新注册
        addEffectDestroy(subscribeDragMove((p) => {
          if (movePoint.get()) {
            if (p) {
              movePoint.set(p)
              dispatch({
                type: "didMove",
                version: version,
                point: p.pageY,
                elements: getElements(),
                scrollTop: container.scrollTop
              })
            } else {
              p = movePoint.get()!
              movePoint.set(undefined)
              dispatch({
                type: "end",
                version: version,
                point: p.pageY,
                elements: getElements(),
                scrollTop: container.scrollTop
              })
            }
          }
        }))
      }, emptyArray)

      const hasEnd = useStoreTriggerRender(vc, getEndAt)
      useEffect(() => {
        if (hasEnd) {
          messageChannelCallback(() => {
            dispatch({
              type: "didEnd",
              version,
              scrollTop: container.scrollTop,
              elements: getElements()
            })
          })
        }
      }, [hasEnd])
    }
  }
}


function getEndAt<K>(model: ReorderLocalModel<K>) {
  return model.onMove?.endAt
}


const endConfig = getTweenAnimationConfig(400, easeFns.out(easeFns.circ))