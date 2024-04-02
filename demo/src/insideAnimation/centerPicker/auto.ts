

import { useAtom, useOneEffect } from "better-react-helper";
import template from "./template";



export default function () {
  template(function (
    index,
    getDiv,
    addIndex
  ) {
    const initScrollheight = useAtom<number | undefined>(undefined)
    const scrollTopValue = useAtom(0)
    useOneEffect((e) => {
      const div = getDiv()
      if (typeof e.beforeTrigger == 'number') {
        const diffIdx = e.trigger - e.beforeTrigger
        const targetValue = scrollTopValue.get() - 26 * diffIdx
        scrollTopValue.set(targetValue)
        div.scrollTo({
          top: targetValue,
          // behavior: "instant"
        })
      } else {
        //第一次
        const maxScrollheight = div.scrollHeight - div.clientHeight
        const ish = maxScrollheight / 2 + 13
        initScrollheight.set(ish)
        div.scrollTop = ish
        scrollTopValue.set(ish)
      }
    }, index)

    return {
      style: `
        overflow-y:auto;
        scroll-snap-type:y mandatory;
      `,
      onScroll(e) {
        const div = getDiv()
        //减少回流...
        scrollTopValue.set(div.scrollTop)
        const ish = initScrollheight.get()
        if (typeof ish == 'number') {
          const top = scrollTopValue.get()
          let diff = top - ish
          // console.log("diff", diff)
          if (diff >= 26) {
            addIndex(1)
          } else if (diff <= -26) {
            addIndex(-1)
          }
        }
      },
    }
  })
}