import { useEffect, useMemo, useOneEffect } from "better-react-helper";
import template from "./template";
import { EmptyFun, easeFns, emptyArray, momentum, syncMergeCenter } from "wy-helper";
import { recicleScrollViewView } from "wy-dom-helper";
import { flushSync, hookCommitAll } from "better-react";

const easeScroll = easeFns.out(easeFns.circ)
export default function () {
  template(function (index,
    getDiv,
    addIndex,
    getContainer) {
    // const commitAll = hookCommitAll()
    // function flushSync(fun: EmptyFun) {
    //   fun()
    //   commitAll()
    // }

    const { scroll, setInitScrollHeight, wrapperAdd, trans: transY } = useMemo(() => {
      return recicleScrollViewView(flushSync, addIndex, 26, momentum.iScrollIdeal(), easeScroll)
    })
    useOneEffect((e) => {
      const div = getDiv()
      const maxScrollheight = div.scrollHeight - div.clientHeight
      const ish = -(maxScrollheight / 2)
      setInitScrollHeight(ish)
    }, emptyArray)
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
      wrapperAdd(idx) {
        wrapperAdd(idx, {
          duration: 300,
          fn: easeScroll
        })
      },
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