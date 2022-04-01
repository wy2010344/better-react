import { BetterNode, createElement } from 'better-react-dom'
import { useRefValue } from "better-react"
import { dragMoveHelper, dragResizeHelper } from "./drag"
import ReSize from "./ReSize"
import { useState } from 'better-react-helper'
import { useRef } from 'better-react-helper'

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
  const titleHeight = 32;
  return (
    <div ref={container} css={`
      position:absolute;background:white;
      border:1px solid gray;
      width:${width}px;
      height:${height}px;
      left:${left}px;top:${top}px;
      box-shadow:0px 0px 20px 10px;          
      border-radius:5px;
    `}
      onClick={moveFirst}
    >
      <ReSize resize={dragResize as any} />
      <div
        onMouseDown={moveRef as any}
        css={`
          height:${titleHeight}px;
          cursor:move;
          display:flex;align-items:center;
          background:linear-gradient(180deg,transparent, #9e9595, transparent);
        `}>
        <div css={`
            flex:1;color:#1f0abc;
          `}>
          {title}
        </div>
        <button
          css={`
            width:${titleHeight}px;height:${titleHeight}px;
            padding:0;margin:0;border:none;
            display:flex;align-items:center;justify-content:center;
            background:none;
            svg {
              width:20px;
              height:20px;
              color:yellow;
            }
          `}
          onClick={(e) => {
            e.stopPropagation()
            close()
          }}>
          <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 0 1-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"></path>
          </svg>
        </button>
      </div>
      {children({ width, height })}
    </div>
  )
}