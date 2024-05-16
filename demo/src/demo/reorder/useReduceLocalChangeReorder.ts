import { useAtom, useEffect, useStoreTriggerRender } from "better-react-helper"
import { ValueCenter, easeFns, messageChannelCallback } from "wy-helper"
import { ReorderAction, ReorderElement, ReorderModel, reorderReducer } from "./reducerLocalChange"
import { subscribeEdgeScroll, subscribeMove } from "wy-dom-helper"




export function userReducerLocalChangeReorder<K>(
  version: number,
  vc: ValueCenter<ReorderModel<K>>
) {
  const movePoint = useAtom<PointerEvent | undefined>(undefined)
  function dispatch(action: ReorderAction<K>) {
    vc.set(reorderReducer(vc.get(), action))
  }
  // vc.get().onMove?.info?.lastPoint
  return {
    start(e: PointerEvent, key: K, container: HTMLElement) {
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
      elements: ReorderElement<K>[]
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
      getElements: () => ReorderElement<K>[]
    ) {
      useEffect(() => {
        return subscribeEdgeScroll(() => {
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
        })
      })
      useEffect(() => {
        //不依赖,每次重新注册
        return subscribeMove(function (e: PointerEvent, end?: boolean) {
          if (movePoint.get()) {
            if (end) {
              movePoint.set(undefined)
              dispatch({
                type: "end",
                version: version,
                point: e.pageY,
                elements: getElements(),
                scrollTop: container.scrollTop,
                config: endConfig
              })
            } else {
              movePoint.set(e)
              dispatch({
                type: "didMove",
                version: version,
                point: e.pageY,
                elements: getElements(),
                scrollTop: container.scrollTop
              })
            }
          }
        })
      })


      const hasEnd = useStoreTriggerRender(vc, getEndAt)
      useEffect(() => {
        if (hasEnd) {
          messageChannelCallback(() => {
            dispatch({
              type: "didEnd",
              scrollTop: container.scrollTop,
              elements: getElements(),
              config: endConfig
            })
          })
        }
      }, [hasEnd])
    }
  }
}


function getEndAt<K>(model: ReorderModel<K>) {
  return model.onMove?.endAt
}

const endConfig = {
  duration: 400,
  fn: easeFns.out(easeFns.circ)
}