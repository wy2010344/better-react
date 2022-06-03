
import { BetterNode } from "better-react-dom"
import { useState, useRefValue } from "better-react-helper"
import { dragMoveHelper, dragMoveUtil } from "./drag"




export default function FrePanel({
  children
}: {
  children?: BetterNode
}) {
  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)
  const ref = useRefValue(() => dragMoveHelper({
    diffX(x) {
      setLeft(setLeft() + x)
    },
    diffY(y) {
      setTop(setTop() + y)
    }
  }))()
  return <div style={{
    position: "fixed",
    top: `${top}px`,
    left: `${left}px`,
    width: "400px",
    height: "300px",
    backgroundColor: "white",
    border: "1px solid grey",
    overflow: "auto"
  }}>
    <div
      onMouseDown={e => ref(e as any)}
      style={{
        height: "32px",
        backgroundColor: "gray"
      }}>这是标题</div>
    {children}
  </div>
}