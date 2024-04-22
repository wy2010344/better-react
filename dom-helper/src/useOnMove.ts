import { useAttrEvent, useOneEffect } from "better-react-helper"

export type MoveEvent = "pointer" | "touch" | "mouse"
export function useOnMove(
  onMove: (e: PointerEvent, end?: boolean) => void,
  eventType?: "pointer"
): void
export function useOnMove(
  onMove: (e: TouchEvent, end?: boolean) => void,
  eventType: "touch"
): void
export function useOnMove(
  onMove: (e: MouseEvent, end?: boolean) => void,
  eventType: "mouse"
): void
export function useOnMove(
  onMove: (e: any, end?: boolean) => void,
  eventType: MoveEvent = "pointer"
) {
  const onEventMove = useAttrEvent(onMove)
  useOneEffect(() => {
    function move(e: any) {
      onEventMove(e)
    }
    function end(e: any) {
      onEventMove(e, true)
    }
    if (eventType == "mouse") {
      window.addEventListener("mousemove", move)
      window.addEventListener("mouseup", end)
      return function () {
        window.removeEventListener("mousemove", move)
        window.removeEventListener("mouseup", end)
      }
    } else if (eventType == "pointer") {
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", end)
      window.addEventListener("pointercancel", end)
      return function () {
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", end)
        window.removeEventListener("pointercancel", end)
      }
    } else if (eventType == "touch") {
      window.addEventListener("touchmove", move)
      window.addEventListener("touchend", end)
      window.addEventListener("touchcancel", end)
      return function () {
        window.removeEventListener("touchmove", move)
        window.removeEventListener("touchend", end)
        window.removeEventListener("touchcancel", end)
      }
    } else {
      throw new Error('不知道是什么类型' + eventType)
    }
  }, eventType)
}
