import { BetterNode } from "../better-react/Fiber"
import Better from '../better-react'
import { useEffect, useRef, useRefValue, useState } from "../better-react/fc"
import { dragMoveHelper, dragMoveUtil } from "./drag"
import { useRefVueValue } from "../better-react-helper/VueAdapter"
import { newLifeModel } from "../better-react-helper/Vue"

export default function PanelMve({
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

  const moveLeft = useRefVueValue(100)
  const moveTop = useRefVueValue(100)
  const moveRef = useRefValue(function () {
    return dragMoveHelper({
      diffX(x) {
        moveLeft(moveLeft() + x)
      },
      diffY(y) {
        moveTop(moveTop() + y)
      }
    })
  })()


  useEffect(function () {
    const ref = container()
    console.log("useEffect", ref)
    if (!ref) return
    const goLeft = (v: number) => {
      ref.style.left = v + "px"
    }
    const goTop = (x: number) => {
      ref.style.top = x + "px"
    }
    const { me, destroy } = newLifeModel()
    me.Watch(function () {
      goLeft(moveLeft())
    })
    me.Watch(function () {
      goTop(moveTop())
    })
    return function () {
      console.log("销毁")
      destroy()
    }
  }, [])
  console.log(children, "mve-children", container())
  return (
    <div ref={container} style={`
      position:absolute;background:white;
      border:1px solid gray;width:${width}px;height:${height}px;
    `}
    >
      <div
        onMouseDown={moveRef}
        style={`
height:32px;cursor:move;
`}>ggggg</div>
      {children}
    </div>
  )
}