import { useEffect } from "better-react-helper";
import { renderTemplate } from "./template";
import { useTimeoutAnimateValue } from "better-react-helper";
import { Point, emptyArray, pointEqual, pointZero, syncMergeCenter } from "wy-helper";
import { requesetBatchAnimationForceFlow } from "wy-dom-helper";


export default function () {
  renderTemplate(function (getDiv) {
    const trans = useTimeoutAnimateValue<Point, string>(pointZero, pointEqual)
    useEffect(() => {
      return syncMergeCenter(trans, function (value) {
        const div = getDiv()
        const style = div.style
        if (value.config) {
          //如果动作太快,并不是平滑过渡的!!
          const c = value.config
          requesetBatchAnimationForceFlow(div, function () {
            style.transition = `transform ${c.value} ${c.duration}ms`;
            style.transform = `translate(${-(value.value.x)}px,${-(value.value.y)}px)`
          })
        } else {
          style.transition = ''
          style.transform = `translate(${-(value.value.x)}px,${-(value.value.y)}px)`
        }
      })
    }, emptyArray)

    return function (ps, lastPs) {
      const old = trans.get()
      const br = getDiv().getBoundingClientRect()
      let currentTransX = old.value.x
      let currentTransY = old.value.y
      if (old.config) {
        currentTransX = br.left - ps.x
        currentTransY = br.top - ps.y
      }
      trans.changeTo({
        x: currentTransX + ps.x - lastPs.x,
        y: currentTransY + ps.y - lastPs.y
      })
      trans.changeTo(pointZero, {
        duration: 1000,
        value: 'ease'
      })
    }
  })
}