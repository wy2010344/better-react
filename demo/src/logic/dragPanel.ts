import { StoreRef, emptyArray } from "better-react";
import { React, domOf } from "better-react-dom";
import { useChange, useReducer, useAtom, useEffect } from "better-react-helper";

type AbsPointerEvent = {
  clientX: number
  clientY: number
}
export type MoveStep = "down" | "move" | "up"

type OnEvent = (step: MoveStep, e: AbsPointerEvent) => void
export function useBaseOnPointerdown(
  setE: (e: AbsPointerEvent, lastE: AbsPointerEvent) => void,
  onEvent?: OnEvent
) {
  const lastPointerRef = useAtom<AbsPointerEvent | undefined>(undefined)
  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const lastPointer = lastPointerRef.get()
      if (lastPointer) {
        lastPointerRef.set(e)
        setE(e, lastPointer)
        onEvent?.("move", e)
      }
    }
    function onPointerUp(e: PointerEvent) {
      const lastPointer = lastPointerRef.get()
      if (lastPointer) {
        setE(e, lastPointer)
        lastPointerRef.set(undefined)
        onEvent?.("up", e)
      }
    }
    document.addEventListener("pointermove", onPointerMove)
    document.addEventListener("pointerup", onPointerUp)
    return function () {
      document.removeEventListener("pointermove", onPointerMove)
      document.removeEventListener("pointerup", onPointerUp)
    }
  }, emptyArray)
  return function (e: React.PointerEvent<any>) {
    if (lastPointerRef.get()) {
      return
    }
    lastPointerRef.set(e)
    onEvent?.("down", e)
  }
}


function reducerIns(value: number, action: number) {
  return value + action
}
/**
 * clientX - containerX = 宽度 + 间隔
 * clientX - splitX = 间隔
 * 
 * @param getLeft 
 * @param init 
 * @returns 
 */
export function useDragdownX(init = 0, onEvent?: OnEvent) {
  const [x, addX] = useReducer(reducerIns, init)
  const onPointerDown = useBaseOnPointerdown(function (e, lastE) {
    addX(e.clientX - lastE.clientX)
  }, onEvent)
  return [x, onPointerDown] as const
}

export function useDragdownY(init = 0, onEvent?: OnEvent) {
  const [y, addY] = useReducer(reducerIns, init)
  const onPointerDown = useBaseOnPointerdown(function (e, lastE) {
    addY(e.clientY - lastE.clientY)
  }, onEvent)
  return [y,
    onPointerDown,
  ] as const
}