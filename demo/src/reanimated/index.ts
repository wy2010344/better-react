import { dom } from "better-react-dom";
import { useChange, useMemo, useVersion } from "better-react-helper";

/**
 * 可见css动画是连续的,从上次动画处开始
 * 但动画效果与时间,却是下次生效....
 */
export default function () {
  const [version, updateVersion] = useVersion()
  const [version2, updateVersion2] = useVersion()
  const direction = useMemo(() => {
    const i = version % 4

    console.log("开始", Date.now())
    if (i == 0) {
      return 'translate(0px,0px)'
    } else if (i == 1) {
      return 'translate(100%,0px)'
    } else if (i == 2) {
      return 'translate(100%,100%)'
    } else {
      return 'translate(0px,100%)'
    }
  }, [version])
  const time = useMemo(() => {
    const i = version2 % 3
    console.log("开始", Date.now())
    if (i == 0) {
      return 0.1
    } else if (i == 1) {
      return 1
    } else {
      return 10
    }
  }, [version2])
  dom.div().render(function () {
    dom.button({
      onClick(event) {
        updateVersion()
      },
    }).text`${direction}`
    dom.button({
      onClick(event) {
        updateVersion2()
      },
    }).text`${time}`
  })

  const div = dom.div({
    style: `
    width:100px;
    height:100px;
    background:green;
    transition: all ease ${time}s;
    transform:${direction};
    `,
    onTransitionCancel() {

      console.log("中断", Date.now())
    },
    onTransitionEnd() {
      console.log("结束", Date.now())
    }
  }).render()
}