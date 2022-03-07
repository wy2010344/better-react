import { BetterNode } from "./better-react/Fiber"
import Better from '../src/better-react'
import { useEffect, useRef, useRefValue, useState } from "./better-react/fc"
import { dragMoveHelper, dragMoveUtil } from "./drag"
import { ValueCenter } from "./better-react/ValueCenter"

export default function Panel({
  children
}: {
  children: BetterNode[]
}) {
  const [top, valueTop] = useState(100)
  const [left, valueLeft] = useState(100)
  const [width, valueWidth] = useState(400)
  const [height, valueHeight] = useState(600)
  const container = useRef<HTMLElement | undefined>(undefined)
  const movePoint = useRef<MouseEvent | undefined>(undefined)

  const moveLeft = useRefValue(function () {
    return new ValueCenter(100)
  })
  const moveTop = useRefValue(function () {
    return new ValueCenter(100)
  })
  const moveRef = useRefValue(function () {
    return dragMoveHelper({
      diffX(x) {
        moveLeft().set(moveLeft().get() + x)
      },
      diffY(y) {
        moveTop().set(moveTop().get() + y)
      }
    })
  })


  useEffect(function () {
    const ref = container()
    if (!ref) return
    const goLeft = (v: number) => {
      ref.style.left = v + "px"
    }
    const goTop = (x: number) => {
      ref.style.top = x + "px"
    }
    moveLeft().add(goLeft)
    moveTop().add(goTop)
    return function () {
      moveLeft().remove(goLeft)
      moveTop().remove(goTop)
    }
  }, [])
  return (
    <div ref={container} style={`
      position:absolute;
      border:1px solid gray;width:${width}px;height:${height}px;
    `}>
      <div
        onMouseDown={moveRef()}
        style={`
      height:32px;cursor:move;
      `}></div>
      {children}
    </div>
  )
}