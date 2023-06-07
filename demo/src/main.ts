import App from "./App";
import { AskNextTimeWork, useEffect, useFiber } from "better-react";
import { useContent, useDom, scheduleAskTime, StyleContext, createRoot } from "better-react-dom";
import { CountContext, PanelCollection, PanelContext, PanelOperate } from "./panel/PanelContext";
import { useStoreTriggerRender, useMap, useState, valueCenterOf, useFragment, useMemo } from "better-react-helper";
import { StylisCreater } from "stylis-creater";

import test from './test'
import cssHasCursor from "./learn/css-has-cursor";

const askTimeWork: AskNextTimeWork = function (getNextWork) {
  let work = getNextWork()
  while (work) {
    work()
    work = getNextWork()
  }
}
const destroy = createRoot(
  document.getElementById("app")!,
  function () {
    StyleContext.useProvider(StylisCreater)
    console.log("root-render")
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
      const oldSet = panels.set
      panels.set = function (sv) {
        console.log("mvs", sv)
        oldSet(sv)
      }
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
          if (oldIndex > -1 && oldIndex != vs.length - 1) {
            console.log(oldIndex, vs.length, "cxxxx---")
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
    console.log("render-out-1")
    useFragment(function () {
      const vs = useStoreTriggerRender(panels)
      console.log("render-out")
      useMap(vs, v => v.id, v => {
        useFragment(function () {
          v.callback(v.id)
        }, [v.callback, v.id])
      })
    }, [panels])
  },
  //askTimeWork,
  //askIdleTimeWork,
  // askTimeWork,
  scheduleAskTime
);

