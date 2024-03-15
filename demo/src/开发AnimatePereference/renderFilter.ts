import { faker } from "@faker-js/faker"
import { dom } from "better-react-dom"
import { getTimeoutPromise, renderInput, useTriggerStyleWithShow } from "better-react-dom-helper"
import { renderArray, renderExitAnimateArray, useChange, useEffect, useMemo, useRenderExitAnimate } from "better-react-helper"
import { CSSProperties, ClsWithStyle, stringifyStyle } from "wy-dom-helper"
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

    //   // useEffect(()=>{

    //   //   const rect1 = div.getBoundingClientRect()
    //   //   div.style.transform = ''
    //   // })
    //   // useRequesetAnimationFrameEvent(function () {
    //   //   forceFlow(div)
    //   //   const rect0 = div.getBoundingClientRect()
    //   //   div.style.transform = `translate(${rect0.left - rect1.left}px, ${rect0.top - rect1.top}px)`
    //   // })
    // })
    const mlist = useRenderExitAnimate(filterList, v => v.id, {
      wait: "out-in"
    })
    renderExitAnimateArray(mlist, function (row) {
      const waitFinish = getTimeoutPromise(1000, row.resolve)
      const { style } = useTriggerStyleWithShow<HTMLDivElement, ClsWithStyle>(() => div!, row.exiting, {
        from: {
          style: {
            opacity: 0,
            transform: `translateX(-100%)`
          } as CSSProperties
        },
        target: {
          style: {
            transition: `all ease 1s`,
            opacity: 1,
            transform: `translateX(0)`
          }
        },
        waitFinish
      }, {
        target: {
          style: {
            transition: `all ease 1s`,
            opacity: 0,
            transform: `translateX(-100%)`
          }
        },
        waitFinish
      })

      const div: HTMLDivElement = dom.div({
        style: stringifyStyle(style!)
      }).renderText`${row.value.name}`
    })
  })
}