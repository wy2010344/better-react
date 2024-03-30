import { MemoEvent } from "better-react"
import { SvgElement, SvgElementType } from "./html"
import { useMemo } from "better-react-helper"

export function createSvgElement(e: MemoEvent<string>) {
  return document.createElementNS("http://www.w3.org/2000/svg", e.trigger)
}
export function useSvgNode<T extends SvgElementType>(
  type: T
): SvgElement<T> {
  return useMemo(createSvgElement, type)
}

