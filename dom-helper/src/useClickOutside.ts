import { useEffect } from "better-react"
import { useEvent } from 'better-react-helper'

export function useClickOutside(
  contains: (e: Node) => boolean,
  click: (e: MouseEvent) => void
) {
  const onClick = useEvent((e: MouseEvent) => {
    if (!contains(e.target as Node)) {
      click(e)
    }
  })
  useEffect(() => {
    document.addEventListener("click", onClick)
    return function () {
      document.removeEventListener("click", onClick)
    }
  }, [])
}