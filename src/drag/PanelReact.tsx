import { BetterNode, createElement } from '../better-react-dom'
import { useRefValue } from "better-react"
import { dragMoveHelper, dragResizeHelper } from "./drag"
import ReSize from "./ReSize"
import { useState } from '../better-react-helper/useState'
import { useRef } from '../better-react-helper/useRef'

export type RenderChildren = (x: { width: number, height: number }) => BetterNode

export default function PanelReact({
  title,
  children,
  close,
  moveFirst
}: {
  title?: BetterNode
  children: RenderChildren
  close(): void
  moveFirst(): void
}) {
  const [top, valueTop] = useState(100)
  const [left, valueLeft] = useState(100)
  const [width, valueWidth] = useState(400)
  const [height, valueHeight] = useState(600)
  const container = useRef<HTMLElement | undefined>(undefined)

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


  const dragResize = useRefValue(() => {
    return dragResizeHelper({
      addHeight(x) {
        valueHeight(valueHeight() + x)
      },
      addLeft(x) {
        valueLeft(valueLeft() + x)
      },
      addTop(x) {
        valueTop(valueTop() + x)
      },
      addWidth(x) {
        valueWidth(valueWidth() + x)
      }
    })
  })()
  //console.log(children, "react-children", container())
  return (
    <div ref={container} style={`
      position:absolute;background:white;
      border:1px solid gray;
      width:${width}px;
      height:${height}px;
      left:${left}px;top:${top}px;
      box-shadow:0px 0px 20px 10px;
    `}
      onClick={moveFirst}
    >
      <ReSize resize={dragResize as any} />
      <div
        onMouseDown={moveRef as any}
        style={`
height:32px;cursor:move;
`}>
        {title}
        <button>o</button>
        <button onClick={(e) => {
          e.stopPropagation()
          close()
        }}>X</button>
      </div>
      {children({ width, height })}
    </div>
  )
}