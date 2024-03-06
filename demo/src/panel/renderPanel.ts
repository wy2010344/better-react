import { useEffect } from "better-react-helper"
import { dom, domOf, useDom, useSvg } from "better-react-dom"
import { initDrag, resizeHelper } from "./drag"
import useResize from "./useResize"
import { useState, useMemo } from "better-react-helper"
import { ReduceState } from "wy-helper"

export type Size = {
  width: [number, ReduceState<number>]
  height: [number, ReduceState<number>]
  top: [number, ReduceState<number>]
  left: [number, ReduceState<number>]
}

export type PanelParams = {
  // portalTarget?(): Node
  title?(): void
  bodyStyle?: string
  children(p: Size, body: HTMLElement): void
  close(): void
  moveFirst(): void
  asPortal?: boolean
}

function renderPanel({
  width: [width, setWidth] = useState(400),
  height: [height, setHeight] = useState(600),
  top: [top, setTop] = useState(100),
  left: [left, setLeft] = useState(200),
  title,
  bodyStyle,
  children,
  close,
  moveFirst,
  asPortal
  // portalTarget
}: PanelParams & Partial<Size>) {
  const dragResize = useMemo(() => resizeHelper({
    addWidth(w) {
      setWidth(v => v + w)
    },
    addHeight(h) {
      setHeight(v => v + h)
    },
    addLeft(x) {
      setLeft(v => v + x)
    },
    addTop(y) {
      setTop(v => v + y)
    }
  }), [])

  const titleHeight = 32
  return dom.div({
    // portalTarget,
    style: `
      left: ${left}px;
      top: ${top}px;
      position:absolute;
      background:white;
      border:1px solid gray;
      width:${width}px;
      height:${height}px;
      box-shadow:0px 0px 20px 10px;
      border-radius:5px;
    `,
    onClick: moveFirst,
  }).setPortal(asPortal).render(function () {

    useResize(dragResize)

    useEffect(() => {
      return initDrag(container, {
        move(e) {
          e.preventDefault()
          e.stopPropagation()
        },
        diffX(x) {
          setLeft(v => v + x)
        },
        diffY(y) {
          setTop(v => v + y)
        }
      })
    }, [])

    const container = useDom("div", {
      style: `
          height:${titleHeight}px;
          cursor:move;
          display:flex;align-items:center;
          background:linear-gradient(180deg,transparent, #9e9595, transparent);
        `,
      children() {
        useDom("div", {
          style: ` 
            flex:1;color:#1f0abc;
            `,
          children: title
        })
        dom.button({
          style: `
            width:${titleHeight}px;
            height:${titleHeight}px;
            padding:0;margin:0;border:none;
            display:flex;
            align-items:center;
            justify-content:center;
            background:none;
            `,
          onClick(e) {
            e.stopPropagation()
            close()
          },
          children() {
            useSvg("svg", {
              fill: "currentColor",
              strokeWidth: '0',
              viewBox: "0 0 1024 1024",
              style: `
                width:20px;
                height:20px;
                color:yellow;
              `,
              children() {
                useSvg("path", {
                  d: `M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 0 1-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z`
                })
              }
            })
          }
        })

      }
    })

    const div = domOf("div", {
      style: `
        position:relative;
        ${bodyStyle || ''}
        width:${width}px;
        height:${height - titleHeight}px;
        `,
    }).render(function () {
      children({
        width: [width, setWidth],
        height: [height, setHeight],
        top: [top, setTop],
        left: [left, setLeft],
      }, div)
    })
  })
}

/**
 * desktop-panel和portal是不同的
 * desktop-panel是模型为中心,所以不是render控制的,而是状态控制的
 * portal是状态控制的
 */
export default renderPanel