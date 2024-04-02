import { useAtom, useEffect, useMemo, useOneEffect } from "better-react-helper";
import template from "./template";
import { buildNoEdgeScroll, buildScroll, easeFns, emptyArray, momentum, syncMergeCenter } from "wy-helper";
import { useAnimationFrameNumber } from "better-react-dom-helper";
import { AnimateFrameValue } from "wy-dom-helper";
import { hookCommitAll } from "better-react";

export function animateNumberSilientChangeDiff(n: AnimateFrameValue<number>, diff: number) {
  const ato = n.getAnimateTo()
  if (ato) {
    n.slientChange(ato.target + diff, ato.from + diff)
  } else {
    n.changeTo(n.get() + diff)
  }
}
export function animateNumberSilientChangeTo(n: AnimateFrameValue<number>, value: number) {
  const ato = n.getAnimateTo()
  if (ato) {
    n.slientChange(value, ato.from + value - ato.target)
  } else {
    n.changeTo(value)
  }
}

const easeScroll = easeFns.out(easeFns.circ)
export default function () {
  template(function (index,
    getDiv,
    addIndex,
    getContainer) {

    const initScrollheight = useAtom<number>(0)
    const transY = useAnimationFrameNumber(0)

    //锁的频率跟解锁不对应,无法观测到?
    const lockUpdate = useAtom(0)

    const commitAll = hookCommitAll()
    useOneEffect((e) => {
      const div = getDiv()
      if (typeof e.beforeTrigger == 'number') {
        animateNumberSilientChangeTo(transY, initScrollheight.get())
        lockUpdate.set(lockUpdate.get() - (e.trigger - e.beforeTrigger))
        console.log("change", lockUpdate.get())
        // if (transY.getAnimateTo()) {
        //   animateNumberSilientChangeTo(transY, initScrollheight.get())
        //   lockUpdate.set(false)
        // } else {
        //   // const diffIdx = e.trigger - e.beforeTrigger
        //   // transY.changeTo(initScrollheight.get(), {
        //   //   duration: 300,
        //   //   fn: easeScroll
        //   // })
        // }
      } else {
        const maxScrollheight = div.scrollHeight - div.clientHeight
        const ish = -(maxScrollheight / 2 + 13)
        initScrollheight.set(ish)
        transY.changeTo(ish)
        console.log("vsvs", ish)
      }
    }, index)


    const scroll = useMemo(() => {

      function diffUpdate(v: number) {
        const diff = v - initScrollheight.get()
        console.log("diff", diff)
        if (!lockUpdate.get()) {
          if (diff > 26) {
            const idx = -Math.floor(diff / 26)
            if (idx) {
              lockUpdate.set(lockUpdate.get() + idx)
              addIndex(idx)
            }
            // commitAll()
          } else if (diff < -26) {
            const idx = -Math.ceil(diff / 26)
            if (idx) {
              lockUpdate.set(lockUpdate.get() + idx)
              addIndex(idx)
            }
            // commitAll()
          }
        }
      }
      return buildNoEdgeScroll({
        changeDiff(diff, duration) {
          const value = transY.get() + diff
          if (typeof duration == 'number') {
            const idx = Math.round((value - initScrollheight.get()) / 26)
            transY.changeTo(initScrollheight.get() + idx * 26, {
              duration,
              fn: easeScroll
            }, {
              onTrigger: diffUpdate
            })
          } else {
            transY.changeTo(value)
            diffUpdate(value)
          }
        },
        momentum: momentum.iScrollIdeal()
      })
    })
    useEffect(() => {
      function move(e: PointerEvent) {
        scroll.move(e.pageY)
      }
      function up(e: PointerEvent) {
        scroll.end(e.pageY)
      }
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
      window.addEventListener("pointercancel", up)

      const div = getContainer()
      const di = syncMergeCenter(transY, function (v) {
        div.style.transform = `translateY(${v}px)`
      })
      return function () {
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
        window.removeEventListener("pointercancel", up)
        di()
      }
    }, emptyArray)
    return {
      style: `
      user-select: none;
overflow:hidden;
`,
      onPointerDown(e) {
        scroll.start(e.pageY)
      }
    }
  })
}