

import { useEffect, useRefValue } from "better-react"
import { dragMoveHelper, dragMoveUtil, dragResizeHelper } from "./drag"
import { useRefVueValue } from "better-react-helper"
import { newLifeModel } from "better-react-helper"
import { moveFirst, removePanel } from "./panel"
import ReSize from "./ReSize"
import { useRef } from 'better-react-helper'
import { React } from "better-react-dom"

export default function PanelMve({
  index,
  children
}: {
  index: string
  children: React.ReactNode
}) {
  const container = useRef<HTMLElement | undefined>(undefined)
  const moveLeft = useRefVueValue(100)
  const moveTop = useRefVueValue(100)
  const width = useRefVueValue(400)
  const height = useRefVueValue(600)
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


  const dragResize = useRefValue(() => {
    return dragResizeHelper({
      addHeight(x) {
        height(height() + x)
      },
      addLeft(x) {
        moveLeft(moveLeft() + x)
      },
      addTop(x) {
        moveTop(moveTop() + x)
      },
      addWidth(x) {
        width(width() + x)
      }
    })
  })()

  useEffect(function () {
    const ref = container()
    console.log("useEffect", ref)
    if (!ref) return
    const { me, destroy } = newLifeModel()
    ref.style.position = 'absolute'
    ref.style.background = 'white'
    ref.style.border = '1px solid gray'
    ref.style.boxShadow = '0px 0px 20px 10px'
    me.Watch(function () {
      ref.style.left = moveLeft() + 'px'
    })
    me.Watch(function () {
      ref.style.top = moveTop() + "px"
    })
    me.Watch(function () {
      ref.style.width = width() + 'px'
    })
    me.Watch(function () {
      ref.style.height = height() + 'px'
    })
    return function () {
      console.log("销毁")
      destroy()
    }
  }, [])
  //console.log(children, "mve-children", container())
  return (
    <div ref={container}
      onClick={() => moveFirst(index)}
    >
      <ReSize resize={dragResize as any} />
      <div
        onMouseDown={moveRef as any}
        style={{
          height: "32px",
          cursor: "move"
        }}>
        <button>o</button>
        <button onClick={(e) => {
          e.stopPropagation()
          removePanel(index)
        }}>X</button>
      </div>
      {children}

    </div>
  )
}