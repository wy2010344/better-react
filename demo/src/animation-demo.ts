import { dom, fdom } from "better-react-dom";
import { useSignalAnimateFrame, useAnimateSignal } from "better-react-dom-helper";
import { renderIf, useConstDep, useVersion } from "better-react-helper";
import { emptyArray, GetValue, SyncFun, trackSignal } from "wy-helper";

export default function () {

  const [version, updateVersion] = useVersion()


  renderIf(version % 2, () => {

    const transX = useSignalAnimateFrame(0)
    dom.div({
      className: "abc"
    })
    // fdom.div({
    //   s_width: '100px',
    //   s_height: '100px',
    //   s_background: 'red',
    //   s_position: 'relative',
    //   s_left: useSignalSync(() => {
    //     return transX.get() + 'px'
    //   })
    // })
    const [version, updateVersion] = useVersion()

    const left = useSignalSync(() => {
      return transX.get() + 'px'
    })
    dom.div({
      style: version % 2 ? {
        width: '100px',
        height: '100px',
        background: 'green',
        position: 'relative',
        left
      } : left,
    }).render()


    fdom.button({
      childrenType: "text",
      children: '动画',
      onClick() {
        transX.animateTo(transX.get() == 0 ? 100 : 0,)
      }
    })

    fdom.button({
      childrenType: "text",
      children: "切换",
      onClick: updateVersion
    })
  })
  fdom.button({
    childrenType: "text",
    children: '增加',
    onClick: updateVersion
  })
}

function useSignalSync<T>(get: GetValue<T>,) {
  return useConstDep<SyncFun<T>>(function () {
    const [set, a, b, c] = arguments
    const destroy = trackSignal(get, set, a, b, c)
    return () => {
      destroy();
      console.log("销毁...")
    }
  }, emptyArray)
}