import { faker } from "@faker-js/faker";
import { React, dom } from "better-react-dom";
import { createUseReducer, createUseReducerFun, renderArray, renderIf, useAtom, useChange, useEffect, useEvent, useMemo, useTimeoutAnimateValue } from "better-react-helper";
import { Box, EmptyFun, Point, arrayToMove, boxEqual, convertBoundingBoxToBox, emptyArray, pointEqual, pointZero, syncMergeCenter } from "wy-helper";
import { useReorder } from "./reorder";
import { useEdgeScroll } from "./edgeScroll";
import { forceFlow, getPageOffset, subscribeRequestAnimationFrame } from "wy-dom-helper";
import { EffectResult, useLevelEffect } from "better-react";
import { Render, renderDrag } from "./renderDrag";

const bList = Array(3).fill(1).map((_, i) => i)
export default function () {
  dom.div({
    style: `
    padding:100px;
    display:flex;
    align-items:flex-start;
    gap:100px;
    `
  }).render(function () {
    const { initRender, updateRender, updateBox, leveContainer, enterContainer, abc } = renderDrag()
    renderArray(bList, v => v, function (i) {
      const [onMove, setOnMove] = useChange<{ index: number }>()
      const [list, dispatch] = useOrderList(() => {
        return Array(faker.number.int({ min: 30, max: 50 })).fill(1).map((_, i) => {
          return {
            index: i,
            avatar: faker.image.urlLoremFlickr({
              category: 'flower',
              width: 30,
              height: 30
            }),
            color: faker.color.rgb(),
            name: faker.person.fullName()
          }
        })
      })
      const reOrder = useReorder('y',
        function (key) {
          return !list.some(v => v.index == key)
        },
        function (itemKey, baseKey) {
          dispatch({
            type: "change",
            key: itemKey,
            baseKey: baseKey
          })
        })
      const container = dom.div({
        style: `
        width:200px;
    height:200px;
    overflow:auto;
      user-select:${onMove ? 'none' : 'unset'};
      background:gray;
      -webkit-user-select:${onMove ? 'none' : 'unset'};
        `,
        onPointerLeave(e) {
          leveContainer(container, e)
        },
        onPointerEnter(e) {
          const row = enterContainer(container, e)
          if (row) {
            dispatch({
              type: "moveIn",
              value: row,
            })
          }
        },
        onScroll(event) {
          reOrder.onScroll(container)
        },
      }).render(function () {
        const setPoint = useEdgeScroll(() => container, {
          y: true,
          padding: 10
        }, {
          disabled: !onMove
        })

        function endMove(p: Point) {
          if (reOrder.end(p)) {
            setOnMove(undefined)
            setPoint(undefined)
          }
        }

        function reOrderMove(p: Point) {
          if (reOrder.move(p)) {
            setPoint(p)
          }
        }
        useEffect(() => {
          function move(e: PointerEvent) {
            const p = {
              x: e.pageX,
              y: e.pageY
            }
            reOrderMove(p)
          }

          function end(e: PointerEvent) {
            const p = {
              x: e.pageX,
              y: e.pageY
            }
            endMove(p)
          }

          window.addEventListener("pointermove", move)
          window.addEventListener("pointerup", end)
          window.addEventListener("pointercancel", end)
          return function () {
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", end)
            window.removeEventListener("pointercancel", end)
          }
        }, emptyArray)

        const isRegist = useAtom<{ index: number } | undefined>(undefined)
        renderArray(list, v => v.index, function (row, index) {
          const trans = useTimeoutAnimateValue<Point, string>(pointZero, pointEqual)

          const { getRender, startMove, beginMoveIn } = useMemo(() => {

            function startMove(point: Point) {
              reOrderChild.start(point, function () {
                trans.changeTo(pointZero, {
                  duration: 300,
                  value: "ease"
                })
              })
              setOnMove(row)
            }
            function beginMoveIn(
              loc: Point,
              pointLoc: Point) {
              const box = getAbsoluteBox(div)
              startMove({
                x: box.x.min + pointLoc.x,
                y: box.y.min + pointLoc.y
              })
              reOrderMove(loc)
            }
            return {
              beginMoveIn,
              startMove,
              getRender(): Render {
                setHide(true)
                let removed = false
                return {
                  container,
                  askToMove() {
                    return row
                  },
                  startRegist() {
                    isRegist.set({
                      index: row.index
                    })
                  },
                  stopRegist() {
                    isRegist.set(undefined)
                  },
                  render(style) {
                    renderDiv(row, {
                      style
                    })
                  },
                  endMove,
                  beginMoveIn,
                  show() {
                    setHide(false)
                  },
                  remove() {
                    if (removed) {
                      return
                    }
                    dispatch({
                      type: "remove",
                      key: row.index
                    })
                    setOnMove(undefined)
                    removed = true
                    return function () {
                      dispatch({
                        type: "insert",
                        index: index,
                        value: row,
                      })
                    }
                  },
                }
              }
            }
          }, emptyArray)
          const isOnMove = onMove?.index == row.index
          const updateMyBox = useEvent(function () {
            if (isOnMove || isRegist.get()?.index == row.index) {
              updateBox(getAbsoluteBox(div))
            }
          })
          useEffect(() => {
            return subscribeRequestAnimationFrame(function () {
              updateMyBox()
            }, true)
          }, emptyArray)
          const reOrderChild = reOrder.useChild(
            row.index,
            index,
            () => div,
            function () {
              return trans.get().value
            },
            function (value) {
              trans.changeTo(value)
            }, function (diff) {
              trans.changeTo(diff)
              forceFlow(div)
              trans.changeTo(pointZero, {
                duration: 600,
                value: 'ease'
              })
            })

          useEffect(() => {
            return syncMergeCenter(trans, function (value) {
              if (value.config) {
                div.style.transition = `transform ${value.config.value} ${value.config.duration}ms`
              } else {
                div.style.transition = ''
              }
              div.style.transform = `translate(${0}px,${value.value.y}px)`
            })
          }, emptyArray)

          useEffect(() => {
            if (row.isMoveIn) {
              updateRender(getRender())
              beginMoveIn(abc.loc, abc.pointLoc)
            }
          }, emptyArray)
          const [hide, setHide] = useChange(false)
          const div = renderDiv(row, {
            // visibility:${hide ? 'hidden' : 'unset'};
            style: `
    z-index:${isOnMove ? 1 : 0};
            `,
            onPointerDown(e) {
              const point = {
                x: e.pageX,
                y: e.pageY
              }
              startMove(point)
              initRender(point, getAbsoluteBox(div), getRender())
            }
          })
        })
      })
    })
  })
}

function getAbsoluteBox(div: HTMLElement): Box {
  const rect = div.getBoundingClientRect()
  return convertBoundingBoxToBox(rect)
}

function renderDiv(row: {
  avatar: string
  name: string
  color: string
}, props?: React.HTMLAttributes<HTMLDivElement>) {
  return dom.div({
    ...props,
    style: `
    display:flex;
    align-items:center;
    margin-bottom:20px;
    background:${row.color};
    position:relative;
    ${props?.style}
    `,
  }).render(function () {
    dom.img({
      src: row.avatar
    }).render()
    dom.span().renderText`${row.name}`
  })
}


type Row = {
  index: number
  avatar: string
  name: string
  color: string
}
const useOrderList = createUseReducerFun<{
  type: "change"
  key: number
  baseKey: number
} | {
  type: "remove",
  key: number
} | {
  type: "insert"
  index: number
  value: Row
} | {
  type: "moveIn"
  value: Row
}, {
  index: number
  avatar: string
  name: string
  color: string
  //初始化带入的点
  isMoveIn?: boolean
}[]>(function (list, action) {
  if (action.type == 'change') {
    const idx = list.findIndex(v => v.index == action.key)
    if (idx < 0) {
      return list
    }
    const idx1 = list.findIndex(v => v.index == action.baseKey)
    if (idx1 < 0) {
      return list
    }
    console.log("change", action, idx, idx1)
    return arrayToMove(list, idx, idx1)
  } else if (action.type == 'remove') {
    return list.filter(v => v.index != action.key)
  } else if (action.type == 'insert') {
    list = list.slice()
    list.splice(action.index, 0, action.value)
    return list
  } else if (action.type == 'moveIn') {
    const max = list.reduce(function (x, i) {
      if (x > i.index) {
        return x
      }
      return i.index
    }, 0)
    return [
      ...list,
      {
        ...action.value,
        isMoveIn: true,
        index: max + 1
      }
    ]
  }
  return list
})