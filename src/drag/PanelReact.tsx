import { BetterNode } from "../better-react/Fiber"
import Better from '../better-react'
import { useEffect, useRef, useRefValue, useState } from "../better-react/fc"
import { dragMoveHelper, dragMoveUtil } from "./drag"
import { useRefVueValue } from "../better-react-helper/VueAdapter"
import { newLifeModel } from "../better-react-helper/Vue"

export default function PanelReact({
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

  const moveRef = useRefValue(function () {
    return dragMoveHelper({
      diffX(x) {
        valueLeft(valueLeft() + x)
      },
      diffY(y) {
        valueTop(valueTop() + y)
      }
    })
  })()
  console.log(children, "react-children", container())
  return (
    <div ref={container} style={`
      position:absolute;background:white;
      border:1px solid gray;width:${width}px;height:${height}px;
      left:${left}px;top:${top}px;
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