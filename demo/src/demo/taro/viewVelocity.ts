import { dom } from "better-react-dom"
import { createUseReducer, renderIf, useChange, useEffect } from "better-react-helper"
import { Point, emptyArray, emptyObject } from "wy-helper"


type LineData = {
  [key in string]: Point[]
}

export const useLineList = createUseReducer((old: LineData, act: {
  type: "append"
  key: string
  value: Point
} | {
  type: "clear"
}) => {
  if (act.type == 'append') {
    const vs = old[act.key] || emptyArray
    return {
      ...old,
      [act.key]: vs.concat(act.value)
    }
  } else if (act.type == "clear") {
    return emptyObject
  }
  return old
})

export default function renderViewVelocity(
  data: LineData,
  display: string
) {

  const [show, setShow] = useChange(false)

  renderIf(show, () => {
    const div = dom.div({
      style: `
    position:fixed;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    `
    }, true).render(() => {
      dom.div({
        style: `
        width:800px;
        height:600px;
        position:relative;
        `
      }).render(() => {
        dom.button({
          style: `
        position:absolute;
        top:-20px;
        right:-20px;
        `,
          onClick() {
            setShow(false)
          }
        }).renderText`X`
        const canvas = dom.canvas({
          width: 800,
          height: 600,
          style: `
      background:white;
      `
        }).render()

        useEffect(() => {
          let minX = Infinity
          let minY = Infinity
          let maxX = -Infinity
          let maxY = -Infinity
          for (let key in data) {
            const row = data[key]
            for (let i = 0; i < row.length; i++) {
              const cell = row[i]
              minX = Math.min(cell.x, minX)
              minY = Math.min(cell.y, minY)
              maxX = Math.max(cell.x, maxX)
              maxY = Math.max(cell.y, maxY)
            }
          }
          console.log(minX, minY, maxX, maxY, data)

          const ctx = canvas.getContext("2d")!
          const width = canvas.width;
          const height = canvas.height;

          const scaleX = width / (maxX - minX)
          const scaleY = height / (maxY - minY)

          ctx.clearRect(0, 0, width, height);

          for (let key in data) {
            const row = data[key]
            const c1 = row[0]
            if (c1) {
              ctx.beginPath()
              ctx.moveTo((c1.x - minX) * scaleX, height - (c1.y - minY) * scaleY)
              for (let i = 1; i < row.length; i++) {
                const c = row[i]
                ctx.lineTo((c.x - minX) * scaleX, height - (c.y - minY) * scaleY)
              }
              ctx.strokeStyle = key;
              ctx.stroke();
            }
          }
        }, [data])
      })
    })
    useEffect(() => {
      document.body.appendChild(div)
      return () => {
        div.parentNode?.removeChild(div)
      }
    }, emptyArray)
  })
  dom.button({
    onClick() {
      setShow(true)
    }
  }).renderTextContent(display)
}