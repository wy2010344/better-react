import { faker } from "@faker-js/faker"
import { dom } from "better-react-dom"
import { createUseReducer, useMemo } from "better-react-helper"
import { dragInit, PagePoint, subscribeDragMove } from "wy-dom-helper"
import { arrayMove, emptyArray } from "wy-helper"



export const dataList = Array(30).fill(1).map((_, i) => {
  return {
    index: i,
    name: faker.person.fullName(),
    avatar: faker.image.urlLoremFlickr({
      width: 100,
      height: 100,
      category: 'orchid'
    })
  }
})
export type DataRow = {
  index: number
  name: string
  avatar: string
}



export function renderRow(
  row: DataRow,
  onDragStart: (e: PagePoint, m: Event) => void) {


  const h = useMemo(() => Math.random() * 50 + 100, emptyArray)
  return dom.div({
    style: `
      display:flex;
      align-items:center;
      margin-top:10px;
      border:1px solid black;
      background:yellow;
      position:relative;
      height:${h}px;
    `,
    ...dragInit(onDragStart)
  }).render(function () {
    dom.img({
      src: row.avatar
    }).render()
    dom.span().renderText`${row.name}`
    dom.hr({
      style: `
      flex:1;
      `
    }).render()
  })
}



export const useReduceList = createUseReducer(function (list: DataRow[], action: {
  type: "change"
  /**
   * 
   */
  from: number
  /**原始位置 */
  to: number
}) {
  if (action.type == 'change') {
    const idx = list.findIndex(v => v.index == action.from)
    if (idx < 0) {
      return list
    }
    const idx1 = list.findIndex(v => v.index == action.to)
    if (idx1 < 0) {
      return list
    }
    return arrayMove(list, idx, idx1, true)
  }
  return list
})
