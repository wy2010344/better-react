import App from "./App";
import { AskNextTimeWork, useLevelEffect, } from "better-react";
import { renderContent, useDom, getScheduleAskTime, createRoot, domOf } from "better-react-dom";
import { CountContext, PanelCollection, PanelContext, PanelOperate } from "./panel/PanelContext";
import { useStoreTriggerRender, renderArray, useState, renderFragment, useMemo, useEffect } from "better-react-helper";
import cssHasCursor from "./learn/css-has-cursor";
import 测试sharePortal from "./测试sharePortal";
import contentEditableReact from "./contentEditableReact";
import ktable from "./ktable";
import d3Learn from "./d3-learn";
import FourierSeries from "./FourierSeries/index";
import numberAnalysis from "./FourierSeries/numberAnalysis";
import logic from "./logic";
import 开发AnimatePreference from "./开发AnimatePereference";
import colorDesign from "./color-design";
import ExpensiveView from "./ExpensiveView";
import { valueCenterOf } from "wy-helper";
import demo1 from "./better-scroll/demo1";
import reanimated from "./reanimated";
import iScroll from "./iScroll";
export function createBr(app: HTMLElement) {

  const destroy = createRoot(
    app,
    iScroll,
    // reanimated,
    // demo1,
    //askTimeWork,
    //askIdleTimeWork,
    // askTimeWork,
    getScheduleAskTime({})
  );

  function MainDemo() {
    useLevelEffect(-10, function () {
      app.offsetHeight
    })
    console.log("root-render")
    useDom("button", {
      className: "abddc",
      "aria-hidden": true,
      onClick() {
        destroy()
      },
      children() {
        renderContent("销毁所有")
      }
    })
    const div = domOf("div").render()
    console.log("正在render")
    const [count, setCount] = useState(0)
    useDom("button", {
      onClick() {
        setCount(v => v + 1)
      },
      children() {
        renderContent(`增加计数 ${count}`)
      }
    })
    useDom("button", {
      onClick() {
        setCount(v => v)
      },
      children() {
        renderContent(`不增加计数`)
      }
    })
    CountContext.useProvider(count)
    测试sharePortal()
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
    useEffect(() => {
      // App(operate)
      // ExpensiveView(operate)
      开发AnimatePreference(operate)
      // logic(operate, null)
      // colorDesign(operate)
      // FourierSeries(operate, null)
      // numberAnalysis(operate, null)
      // contentEditableReact(operate)
      // ktable(operate, null)
      // d3Learn(operate, null)
      // cssHasCursor(operate)
      //learn(operate)
      //jsonRender(operate)
    }, [])
    console.log("render-out-1")
    renderFragment(function () {
      const vs = useStoreTriggerRender(panels)
      console.log("render-out")
      renderArray(vs, v => v.id, v => {
        renderFragment(function () {
          v.callback(v.id)
        }, [v.callback, v.id])
      })
    }, [panels])
  }
}

