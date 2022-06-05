import App from "./App";
import { render, useFragment, useGuard, useGuardString, useIf, useMap, useEffect, useMemo, useState } from "better-react";
import { useContent, useDom, scheduleAskTime, FiberNode, StyleContext } from "better-react-dom";
import dsl from "./dsl";
import { PanelCollection, PanelContext, PanelOperate } from "./panel/PanelContext";
import usePanel from "./panel/usePanel";
import { useStoreTriggerRender, ValueCenter } from "better-react-helper";
import { StylisCreater } from "stylis-creater";

import test from './test'

const node = FiberNode.create(document.getElementById("app")!)
const destroy = render(
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
    test()
    const { panels, operate } = useMemo(() => {
      const panels = ValueCenter.of<PanelCollection>([])
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
    useFragment(App)
    useFragment(RenderHost, panels)
  },
  node,
  //askTimeWork,
  //askIdleTimeWork,
  scheduleAskTime
);


function RenderHost(panels: ValueCenter<PanelCollection>) {
  const vs = useStoreTriggerRender(panels)
  useMap(vs, v => v.id, v => v.callback(v.id))
}
