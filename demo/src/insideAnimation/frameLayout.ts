import { useAnimateFrame } from "better-react-dom-helper";
import { renderTemplate } from "./template";
import { useEffect, useValueCenter } from "better-react-helper";
import { Point, easeFns, emptyArray, getTweenAnimationConfig, pointZero, syncMergeCenter, tweenAnimationConfig } from "wy-helper";

export default function FrameLayout() {

  renderTemplate(function (getDiv: () => HTMLElement) {
    const transX = useAnimateFrame(0)
    const transY = useAnimateFrame(0)
    const styleStore = useValueCenter<Point>(pointZero)
    useEffect(() => {
      const d1 = syncMergeCenter(transX, function (v) {
        // console.log("ddd", v)
        styleStore.set({
          ...styleStore.get(),
          x: v
        })
      })
      const d2 = syncMergeCenter(transY, function (v) {
        styleStore.set({
          ...styleStore.get(),
          y: v
        })
      })
      const d3 = syncMergeCenter(styleStore, function (o) {
        //这个动画不会出现布局列裂开
        getDiv().style.transform = `translate(${-o.x}px,${-o.y}px)`
      })
      return function () {
        d1()
        d2()
        d3()
      }
    }, emptyArray)

    return function (ps, lastPS) {
      transX.changeTo(transX.get() + ps.x - lastPS.x)
      transY.changeTo(transY.get() + ps.y - lastPS.y)

      transX.changeTo(0, getTweenAnimationConfig(1000, easeFns.inOut(easeFns.quad)))
      transY.changeTo(0, getTweenAnimationConfig(1000, easeFns.inOut(easeFns.quad)))
    }
  })
}