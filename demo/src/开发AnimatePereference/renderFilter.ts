import { faker } from "@faker-js/faker"
import { dom } from "better-react-dom"
import { renderInput, useRequesetAnimationFrameEvent, useTriggerStyleWithShow } from "better-react-dom-helper"
import { getTimeoutPromise } from "better-react-dom-helper"
import { useRequesetAnimationFrame } from "better-react-dom-helper/dist/useRequestAnimationFrame"
import { renderArray, renderExitAnimateArray, useChange, useMemo, useRenderExitAnimate } from "better-react-helper"
import { CSSProperties, ClsWithStyle, forceFlow, stringifyStyle } from "wy-dom-helper"
import { emptyArray } from "wy-helper"



export function renderFilter() {

  const [filter, setFilter] = useChange('')

  const list = useMemo(() => {
    return Array(100).fill(1).map((_, i) => {
      return {
        id: i,
        name: faker.animal.cat()
      }
    })
  }, emptyArray)


  const filterList = useMemo(() => {
    const fl = filter.toLocaleLowerCase()
    return list.filter(v => {
      const vl = v.name.toLocaleLowerCase()
      return vl.includes(fl)
    })
  }, [filter])


  dom.div().render(function () {
    renderInput("input", {
      value: filter,
      onValueChange(v) {
        setFilter(v)
      },
    })


    // 仿motion的layout动画比较难的样子
    // renderArray(filterList, v => v.id, function (row) {
    //   const div = dom.div({

    //   }).renderTextContent(row.name)

    //   useRequesetAnimationFrameEvent(function () {
    //     const rect1 = div.getBoundingClientRect()
    //     div.style.transform = ''
    //     forceFlow(div)
    //     const rect0 = div.getBoundingClientRect()
    //     div.style.transform = `translate(${rect0.left - rect1.left}px, ${rect0.top - rect1.top}px)`
    //   })
    // })
    // const mlist = useRenderExitAnimate(filterList, v => v.id)
    // renderExitAnimateArray(mlist, function (row) {
    //   const waitFinish = getTimeoutPromise(1000, row.resolve)
    //   const { style } = useTriggerStyleWithShow<HTMLDivElement, ClsWithStyle>(() => div!, row.exiting, {
    //     from: {
    //       style: {
    //         opacity: 0,
    //         transform: `translateX(-100%)`
    //       } as CSSProperties
    //     },
    //     target: {
    //       style: {
    //         transition: `all ease 1s`,
    //         opacity: 1,
    //         transform: `translateX(0)`
    //       }
    //     },
    //     waitFinish
    //   }, {
    //     target: {
    //       style: {
    //         transition: `all ease 1s`,
    //         opacity: 0,
    //         transform: `translateX(-100%)`
    //       }
    //     },
    //     waitFinish
    //   })

    //   const div: HTMLDivElement = dom.div({
    //     style: stringifyStyle(style!)
    //   }).text`${row.value.name}`
    // })
  })
}