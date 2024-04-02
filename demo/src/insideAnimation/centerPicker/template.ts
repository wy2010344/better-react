import { DomAttribute, dom } from "better-react-dom";
import { hookCommitAll } from 'better-react'
import { createUseReducer, renderArray, useAtom, useChange, useEffect, useMemo, useOneEffect, useValueCenter } from "better-react-helper";
import { readArraySliceCircle, arrayCountCreateWith, emptyArray, numberIntFillWithN0, quote } from "wy-helper";
import { cssMap } from "wy-dom-helper";



const list = arrayCountCreateWith(60, v => v + 1)

const useIndex = createUseReducer(function (value: number, action: {
  type: "add"
  value: number
}) {
  if (action.type == 'add') {
    let nv = value + action.value
    while (nv < 0) {
      nv = nv + list.length
    }
    while (nv >= list.length) {
      nv = nv - list.length
    }
    return nv
  }
  return value
})
export default function (renderBody: (
  index: number,
  getDiv: () => HTMLDivElement,
  addIndex: (v: number) => void,
  getContainer: () => HTMLDivElement
) => DomAttribute<"div">) {
  dom.div({
    style: `
    width:100vw;
    height:100%;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-direction:column;
    background:yellow;
    `,
    onTouchMove(event) {
      event.preventDefault()
    },
  }).renderFragment(function () {
    const [index, dispatchIndex] = useIndex(0)
    dom.div({
      style: `
      display:flex;
      align-items;center;
      `
    }).renderFragment(function () {
      dom.button({
        onClick() {
          dispatchIndex({
            type: "add",
            value: -1
          })
        }
      }).renderText`-`
      dom.div().renderText`index${index}value${list[index]}`
      dom.button({
        onClick() {
          dispatchIndex({
            type: "add",
            value: 1
          })
        }

      }).renderText`+`
    })
    dom.div({
      style: `
      background:white;
      width:300px;
      height:200px;
      position:relative;
      `
    }).renderFragment(function () {

      const { style, ...attrs } = renderBody(
        index,
        () => div,
        n => {
          dispatchIndex({
            type: "add",
            value: n
          })
        }, () => ctRef.get()!)

      const ctRef = useAtom<HTMLDivElement | undefined>(undefined)
      const div = dom.div({
        className: cls.scroll,
        style: `
        position:absolute;
        inset:0;
        ${style}
      `,
        ...attrs
      }).renderFragment(function () {
        const container = dom.div().renderFragment(function () {
          const cacheList = useMemo(() => {
            return readArraySliceCircle(list, index - 6, index + 6)
          }, index)
          renderArray(cacheList, quote, function (row, i) {
            dom.div({
              style: `
          height:25px;
          text-align:center;
          border-bottom:1px solid gray;
          scroll-snap-align:center;
          `
            }).renderText`${numberIntFillWithN0(row, 2)}`
          })
        })
        ctRef.set(container)
      })

      dom.div({
        style: `
        position:absolute;
        display:flex;
        inset:0;
        flex-direction:column;
        align-items:stretch;
        justify-content:center;
        pointer-events:none;
        `
      }).renderFragment(function () {
        dom.div({
          style: `
          height:26px;
          background:green;
          opacity:0.4;
          `
        }).render()
      })
    })
  })
}

const cls = cssMap({
  scroll: `
  &::-webkit-scrollbar {
  display: none;
}
  `
})