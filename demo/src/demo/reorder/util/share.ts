import { faker } from "@faker-js/faker"
import { dom } from "better-react-dom"
import { dragInit, PagePoint, subscribeDragMove } from "wy-dom-helper"



export const dataList = Array(100).fill(1).map((_, i) => {
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
  onDragStart: (e: PagePoint) => void) {

  return dom.div({
    style: `
      display:flex;
      align-items:center;
      margin-top:10px;
      border:1px solid black;
      background:yellow;
      position:relative;
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