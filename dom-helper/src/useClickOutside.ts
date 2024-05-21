import { useEffect } from "better-react-helper"
import { useEvent } from 'better-react-helper'
import { emptyArray } from "wy-helper"

export function useClickOutside(
  contains: (e: Node) => boolean,
  click: (e: MouseEvent) => void
) {
  const onClick = useEvent((e: MouseEvent) => {
    const target = e.target as Node
    if (!contains(target)) {
      click(e)
    }
  })
  useEffect(() => {
    document.addEventListener("click", onClick)
    return [undefined, function () {
      document.removeEventListener("click", onClick)
    }]
  }, emptyArray)
}