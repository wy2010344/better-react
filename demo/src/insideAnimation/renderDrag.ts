import { renderIf, renderOne, useAtom, useChange, useChangeAnimate, useChangeEq, useEffect, useRefValue, useStoreTriggerRender, useTimeoutAnimateValue } from "better-react-helper"
import { CSSProperties } from "wy-dom-helper"
import { Point, Box, EmptyFun, pointZero, pointEqual, emptyArray, boxEqual, boxZero } from "wy-helper"




export type Render = {
  //带一个恢复
  container: HTMLElement
  // remove(): EmptyFun | void
  // endMove(p: Point): void
  // //回到原容器
  // beginMoveIn(loc: Point, pointLoc: Point): void
  // startRegist(): void
  // stopRegist(): void
  // show(): void
  // //进入容器,询问是否移动
  // askToMove(): void | any


  render(style?: CSSProperties): void
  //离开自身容器
  leaveContainer(point: Point): void
  //回到自身容器
  enterContainer(pagePoint: Point, relativePoint: Point): void
  //拖拽放弃
  onDragCancel(p: Point): void | Promise<any>
  //拖拽接受
  onDrop(p: Point): void
  //是否接受放置
  acceptDrop(p: Point): void | any
}

export type Preview = {
  container: HTMLElement
  //展示
  render(style?: CSSProperties): void
  //从容器中移除,自身删除
  onDragLeave(point: Point): void
  //结束移动,升级成正式
  onDrop(p: Point): Promise<any> | void
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
  const [preview, previewValue] = useRefValue<Preview>()
  //鼠标相对块的位置
  const [pointLoc, setPointLoc] = useChangeEq(pointEqual, pointZero)
  //移动位置
  const [loc, setLoc] = useChangeEq(pointEqual, pointZero)



  //render的盒子,需要同步
  const [renderBox, setRenderBox] = useChangeEq(boxEqual, boxZero)
  //preview的盒子,需要同步
  const [previewBox, setPreviewBox] = useChangeEq(boxEqual, boxZero)
  //是否在移动中
  const [onMove, onMoveValue] = useRefValue<'moving' | 'success' | 'fail'>('success')
  const toRender = onMove == 'success' ? preview : onMove == 'fail' ? render : (preview || render)
  renderOne(toRender, function (render) {
    // const loc = useStoreTriggerRender(locAnimate)
    const box = render == preview ? previewBox : renderBox

    const style: CSSProperties = {
      position: "fixed",
      pointerEvents: "none",
      zIndex: 100,
      width: box.x.max - box.x.min + 'px',
      height: box.y.max - box.y.min + 'px'
    }
    if (onMove == 'moving') {
      style.left = loc.x - pointLoc.x + 'px'
      style.top = loc.y - pointLoc.y + 'px'
    } else {

      style.left = box.x.min + 'px'
      style.top = box.y.min + 'px'
      style.transition = 'all ease 600ms'
    }
    render?.render(style)
  })
  useEffect(() => {
    if (render) {
      const us = document.body.style.userSelect
      document.body.style.userSelect = 'none'
      function move(e: PointerEvent) {
        if (onMoveValue.get() == 'moving') {
          setLoc({
            x: e.pageX,
            y: e.pageY
          })
        }
      }
      function end(e: PointerEvent) {
        if (onMoveValue.get() == 'moving') {
          const p = {
            x: e.pageX,
            y: e.pageY
          }
          setLoc(p)
          const render = renderValue.get()!
          const preview = previewValue.get()
          if (preview) {
            onMoveValue.set('success')
            //移动成功
            render.onDrop(p)
            const promise = preview.onDrop(p)
            if (promise) {
              promise.then(function () {
                if (renderValue.get() == render) {
                  renderValue.set(undefined)
                }
                if (previewValue.get() == preview) {
                  previewValue.set(undefined)
                }
              })
            } else {
              renderValue.set(undefined)
              previewValue.set(undefined)
            }
          } else {
            onMoveValue.set('fail')
            const promise = render.onDragCancel(p)
            if (promise) {
              promise.then(function () {
                if (renderValue.get() == render) {
                  renderValue.set(undefined)
                }
              })
            } else {
              renderValue.set(undefined)
            }
          }
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
  function updateInitBox(box: Box) {
    setRenderBox(box)
  }
  function updatePreviewBox(box: Box) {
    setPreviewBox(box)
  }
  return {
    abc: {
      loc,
      pointLoc
    },
    onMove,
    enterContainer(container: HTMLElement, p: Point) {
      if (onMoveValue.get() == 'moving') {
        const rV = renderValue.get()
        if (container == rV?.container) {
          //回到原容器
          rV.enterContainer(p, pointLoc)
        } else {
          return rV?.acceptDrop(p)
        }
      }
    },
    leveContainer(container: HTMLElement, p: Point) {
      if (onMoveValue.get() == 'moving') {
        const rV = renderValue.get()
        if (container == rV?.container) {
          rV.leaveContainer(p)
        } else {
          const preview = previewValue.get()
          if (container == preview?.container) {
            previewValue.set(undefined)
            preview.onDragLeave(p)
          }
        }
      }
    },
    updateInitBox,
    updatePreviewBox,
    updatePreview(render: Preview) {
      previewValue.set(render)
    },
    initRender(initLoc: Point, box: Box, render: Render) {
      setLoc(initLoc)
      updateInitBox(box)
      setPointLoc({
        x: initLoc.x - box.x.min,
        y: initLoc.y - box.y.min
      })
      renderValue.set(render)
      onMoveValue.set('moving')
    }
  }
}