import { renderIf, renderOne, useAtom, useChange, useChangeAnimate, useChangeEq, useEffect, useRefValue, useStoreTriggerRender, useTimeoutAnimateValue } from "better-react-helper"
import { Point, Box, EmptyFun, pointZero, pointEqual, emptyArray } from "wy-helper"




export type Render = {
  //带一个恢复
  container: HTMLElement
  remove(): EmptyFun | void
  endMove(p: Point): void
  beginMoveIn(loc: Point, pointLoc: Point): void
  render(style: string): void
  startRegist(): void
  stopRegist(): void
  show(): void
  askToMove(): void | any
}

/**
 * 如果回到原容器,原容器还在
 * 原容器不在:新建逻辑
 * 原容器还在:通知逻辑
 * 来到新容器:新建逻辑
 * @returns 
 */
export function renderDrag() {
  const [render, renderValue] = useRefValue<Render>()
  //鼠标相对块的位置
  const [pointLoc, setPointLoc] = useChangeEq(pointEqual, pointZero)
  //移动位置
  const [loc, setLoc] = useChangeEq(pointEqual, pointZero)
  //尺寸
  const [size, setSize] = useChangeEq(pointEqual, pointZero)
  //初始化位置,不应该是注册,应该是使用影子元素
  const [initLoc, setInitLoc] = useChangeEq(pointEqual, pointZero)
  //是否在移动中
  const [onMove, onMoveValue] = useRefValue(false)
  renderOne(render, function (render) {
    // const loc = useStoreTriggerRender(locAnimate)
    render?.render(`
    position:fixed;
    pointer-events:none;
    z-index:100;
    width:${size.x}px;
    height:${size.y}px;
    ${onMove ? `
    left:${loc.x - pointLoc.x}px;
    top:${loc.y - pointLoc.y}px;
    `: `
    left:${initLoc.x}px;
    top:${initLoc.y}px;
    transition:all ease 600ms;
    `}
    `)

    useEffect(() => {
      if (render) {
        const us = document.body.style.userSelect
        document.body.style.userSelect = 'none'
        function move(e: PointerEvent) {
          if (onMoveValue.get()) {
            setLoc({
              x: e.pageX,
              y: e.pageY
            })
          }
        }
        function end(e: PointerEvent) {
          if (onMoveValue.get()) {
            onMoveValue.set(false)
            setLoc({
              x: e.pageX,
              y: e.pageY
            })
            const rv = renderValue.get()!
            rv.startRegist()
            setTimeout(() => {
              rv.stopRegist()
              rv.show()
              renderValue.set(undefined)
            }, 600)
          }
        }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", end)
        window.addEventListener("pointercancel", end)
        return function () {
          document.body.style.userSelect = us
          window.removeEventListener("pointermove", move)
          window.removeEventListener("pointerup", end)
          window.removeEventListener("pointercancel", end)
        }
      }
    }, [render])
  })
  function updateBox(box: Box) {
    setSize({
      x: box.x.max - box.x.min,
      y: box.y.max - box.y.min
    })
    setInitLoc({
      x: box.x.min,
      y: box.y.min
    })
  }
  return {
    abc: {
      loc,
      pointLoc
    },
    onMove,
    enterContainer(container: HTMLElement, e: {
      pageX: number
      pageY: number
    }) {
      const rV = renderValue.get()
      if (container == rV?.container) {
        //回到原容器
        // rV.startMove(loc)
        rV.beginMoveIn(loc, pointLoc)
      } else {
        if (rV) {
          return rV.askToMove()
        }
      }
    },
    leveContainer(container: HTMLElement, e: {
      pageX: number
      pageY: number
    }) {
      const rV = renderValue.get()
      if (container == rV?.container) {
        rV.endMove({
          x: e.pageX,
          y: e.pageY
        })
      }
    },
    updateBox,
    updateRender(render: Render) {
      renderValue.set(render)
    },
    initRender(initLoc: Point, box: Box, render: Render) {
      setLoc(initLoc)
      updateBox(box)
      setPointLoc({
        x: initLoc.x - box.x.min,
        y: initLoc.y - box.y.min
      })
      renderValue.set(render)
      onMoveValue.set(true)
    }
  }
}