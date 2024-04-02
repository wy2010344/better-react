
import { faker } from "@faker-js/faker";
import { dom } from "better-react-dom";
import { renderInput } from "better-react-dom-helper";
import { renderArray, useAtom, useChange, useEffect, useMemo, useVersion } from "better-react-helper";
import { getPageOffset, subscribeRequestAnimationFrame } from "wy-dom-helper";
import { Point, pointEqual } from "wy-helper";


const list = Array(100).fill(1).map((_, i) => {
  return {
    index: i,
    name: faker.person.fullName(),
    avatar: faker.image.urlLoremFlickr({
      width: 100,
      height: 100,
      category: 'nature'
    })
  }
})
export function renderTemplate(
  useLayout: (
    getContainer: () => HTMLElement
  ) => (ps: Point, lastPS: Point) => void
) {

  const [version, updateVersion] = useVersion()
  const [filter, setFilter] = useChange('')
  renderInput("input", {
    value: filter,
    onValueChange(v) {
      setFilter(v.trim())
      updateVersion()
    },
  })
  console.log("version", version)
  const filterList = useMemo(() => {
    const fl = filter.toLocaleLowerCase()
    console.log("render-memo", fl)
    return list.filter(row => {
      const ll = row.name.toLocaleLowerCase()
      return ll.includes(fl) || fl.includes(ll)
    })
  }, [filter])
  console.log("filter-ilist", filter)
  dom.div({
    style: `
    display:flex;
    flex-flow:wrap;
    gap:10px;
    `
  }).renderFragment(function () {
    renderArray(filterList, v => v.index, function (row) {
      const lastPSAtom = useAtom<Point | undefined>(undefined)

      const locationChange = useLayout(() => div)

      useEffect(() => {
        return subscribeRequestAnimationFrame(function () {
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
        })
      })
      const div = dom.div({
        style: `
        width:100px;
        display:flex;
        flex-direction:column;
        align-items:center;
        `
      }).renderFragment(function () {
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