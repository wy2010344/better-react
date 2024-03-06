
import { faker, fi } from "@faker-js/faker";
import { useGetFlushSync } from "better-react";
import { dom } from "better-react-dom";
import { renderInput, useRequesetAnimationFrame } from "better-react-dom-helper";
import { useAnimationFrameNumber } from "better-react-dom-helper";
import { renderArray, useAtom, useChange, useEffect, useMemo, useValueCenter, useVersion } from "better-react-helper";
import { getPageOffset } from "wy-dom-helper";
import { Point, TweenFnZXX, TweenFns, emptyArray, pointEqual, syncMergeCenter } from "wy-helper";


const list = Array(100).fill(1).map((_, i) => {
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
export function renderTemplate(
  useLayout: (
    getContainer: () => HTMLElement
  ) => (ps: Point, lastPS: Point) => void
) {

  const [filter, setFilter] = useChange('')
  renderInput("input", {
    value: filter,
    onValueChange(v) {
      setFilter(v.trim())
    },
  })
  const filterList = useMemo(() => {
    const fl = filter.toLocaleLowerCase()
    return list.filter(row => {
      const ll = row.name.toLocaleLowerCase()
      return ll.includes(fl) || fl.includes(ll)
    })
  }, [filter])
  dom.div({
    style: `
    display:flex;
    flex-flow:wrap;
    gap:10px;
    `
  }).render(function () {
    renderArray(filterList, v => v.index, function (row) {
      const lastPSAtom = useAtom<Point | undefined>(undefined)

      const locationChange = useLayout(() => div)
      useRequesetAnimationFrame(function () {
        if (div) {
          const ps = getPageOffset(div)
          const lastPS = lastPSAtom.get()
          if (lastPS) {
            if (!pointEqual(lastPS, ps)) {
              locationChange(ps, lastPS)
              lastPSAtom.set(ps)
            }
          } else {
            //第一次
            lastPSAtom.set(ps)
          }
        }
      })
      const div = dom.div({
        style: `
        width:100px;
        display:flex;
        flex-direction:column;
        align-items:center;
        `
      }).render(function () {
        dom.img({
          src: row.avatar,
          style: `
          display:block;
          width:100px;
          height:100px;
          `
        }).render()
        dom.div().renderText`${row.name}`
      })
    })
  })
}