import App from "./App";
import { useEffect, useMap, useMemo } from "better-react";
import { useContent, useDom, scheduleAskTime, StyleContext, createRoot } from "better-react-dom";
import { CountContext, PanelCollection, PanelContext, PanelOperate } from "./panel/PanelContext";
import { useStoreTriggerRender, useFragment, useState, valueCenterOf } from "better-react-helper";
import { StylisCreater } from "stylis-creater";

import test from './test'
import cssHasCursor from "./learn/css-has-cursor";
const destroy = createRoot(
  document.getElementById("app")!,
  function () {
    StyleContext.useProvider(StylisCreater)
    useDom("button", {
      onClick() {
        destroy()
      },
      children() {
        useContent("销毁所有")
      }
    })
    console.log("正在render")
    const [count, setCount] = useState(0)
    useDom("button", {
      onClick() {
        setCount(v => v + 1)
      },
      children() {
        useContent(`增加计数 ${count}`)
      }
    })
    CountContext.useProvider(count)


    test()
    const { panels, operate } = useMemo(() => {
      const panels = valueCenterOf<PanelCollection>([])
      let uid = 0
      const operate: PanelOperate = {
        push(callback) {
          const id = uid++
          const vs = panels.get()
          panels.set([...vs, { id, callback }])
          return id
        },
        close(id) {
          panels.set(panels.get().filter(v => v.id != id))
        },
        exist(id) {
          return !!panels.get().find(v => v.id == id)
        },
        moveToFirst(id) {
          const vs = panels.get()
          const oldIndex = vs.findIndex(v => v.id == id)
          if (oldIndex > -1) {
            const [old] = vs.splice(oldIndex, 1)
            panels.set([...vs, old])
          }
        }
      }
      return {
        panels,
        operate
      }
    }, [])
    PanelContext.useProvider(operate)
    useFragment(App, [])

    useEffect(() => {
      cssHasCursor(operate)
      //learn(operate)
      //jsonRender(operate)
    }, [])
    useFragment(function () {
      const vs = useStoreTriggerRender(panels)
      useMap(vs, v => v.id, v => v.callback(v.id))
    }, [panels])
  },
  //askTimeWork,
  //askIdleTimeWork,
  scheduleAskTime
);
