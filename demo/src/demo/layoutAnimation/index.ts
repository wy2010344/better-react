import { renderInput } from "better-react-dom-helper";
import { renderPage } from "../util/page";
import { renderArray, useChange, useEffect, useMemo } from "better-react-helper";
import { arrayCountCreateWith, easeFns, emptyArray, getTweenAnimationConfig } from "wy-helper";
import { faker } from "@faker-js/faker";
import { dom } from "better-react-dom";
import { layoutFrameAnimation, subscribeRequestAnimationFrame } from "wy-dom-helper";


const ease = getTweenAnimationConfig(300, easeFns.out(easeFns.circ))
export default function () {
  renderPage({
    title: "layout"
  }, function () {
    const list = useMemo(() => {
      return arrayCountCreateWith(100, i => {
        return {
          index: i,
          name: faker.person.fullName(),
          image: faker.image.url({
            width: 100,
            height: 100
          })
        }
      })
    }, emptyArray)

    const [filter, setFilter] = useChange('')

    const filterList = useMemo(() => {
      const fl = filter.toLocaleLowerCase()
      return list.filter(n => n.name.toLocaleLowerCase().includes(fl))
    }, [filter, list])
    renderInput("input", {
      value: filter,
      onValueChange(v) {
        setFilter(v)
      },
    })
    console.log("dvv", filterList)
    dom.div({
      style: `
      overflow:auto;
      flex:1;
      align-self:stretch;
      `
    }).render(function () {

      dom.div({
        style: `
      display:flex;
      flex-flow:wrap;
      justify-content:center;
      gap:4px;
      `
      }).render(function () {
        console.log("renderAt--")
        renderArray(filterList, v => v.index, function (row) {
          useEffect(() => {
            return layoutFrameAnimation({
              didInit(v) {
                return subscribeRequestAnimationFrame(v)
              },
            })(div, ease)
          }, emptyArray)
          useEffect(() => {
            return () => {
              console.log(`销毁${row.index}`)
            }
          }, emptyArray)
          const div = dom.div({
            style: `
          position:relative;
          `
          }).render(function () {
            console.log("ddren")
            dom.img({
              src: row.image,
              style: `
            display:block
            `,
            }).render()
            dom.div({
              style: `
            position:absolute;
            bottom:0;
            left:0;
            right:0;
            `
            }).renderTextContent(row.name)
          })
        })
      })
    })
  })
}