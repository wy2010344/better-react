// import BScroll from "better-scroll";
import BScroll from '@better-scroll/core'
import Wheel from '@better-scroll/mouse-wheel';
import { Faker, faker } from "@faker-js/faker";
import { dom } from "better-react-dom";
import { renderArray, useEffect } from "better-react-helper";
import { emptyArray } from "wy-helper";


const list = Array(100).fill(1).map((_, i) => {
  return {
    index: i,
    name: faker.animal.cat()
  }
})
export default function () {


  const wrapper = dom.div({
    className: 'wrapper',
    style: `
    position:fixed;
    inset:0;
    `
  }).render(function () {

    useEffect(() => {
      BScroll.use(Wheel)
      const bs = new BScroll(wrapper, {
        // pullUpLoad: true,
        mouseWheel: {
          speed: 20,
          invert: false,
          easeTime: 300
        }
        // scrollbar: true
      })
    }, emptyArray)
    dom.div({
      className: 'content'
    }).render(function () {
      renderArray(list, v => v.index, function (row) {
        dom.div().text`${row.index}--${row.name}`
      })
    })
  })
}