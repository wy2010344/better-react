import { dom } from "better-react-dom";
import { useChange, useMemo, useVersion } from "better-react-helper";

/**
 * 可见css动画是连续的,从上次动画处开始
 * 但动画效果与时间,却是下次生效....
 */
export default function () {
  const [version, updateVersion] = useVersion()
  const [version2, updateVersion2] = useVersion()
  const { direction, color } = useMemo(() => {
    const i = version % 4

    console.log("开始", Date.now())
    if (i == 0) {
      return {
        color: 'green',
        direction: 'translate(0px,0px)'
      }
    } else if (i == 1) {
      return {
        color: 'black',
        direction: 'translate(100%,0px)'
      }
    } else if (i == 2) {
      return {
        color: 'yellow',
        direction: 'translate(100%,100%)'
      }
    } else {
      return {
        color: 'red',
        direction: 'translate(0px,100%)'
      }
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
    }).renderText`${direction}`
    dom.button({
      onClick(event) {
        updateVersion2()
      },
    }).renderText`${time}`
  })

  const div = dom.div({
    //transform ease ${time}s,background ease 0.7s;
    style: `
    width:100px;
    height:100px;
    background:${color};
    transition: all ease ${time}s;
    transform:${direction};
    `,
    onTransitionCancel(e) {

      console.log("中断", e, Date.now())
    },
    onTransitionEnd(e) {
      /**
       * e:propertyName
       * 会为每一个属性播放中止或结束,即使标注的all
       * 或分开为每一个属性配置
       */
      console.log("结束", e, Date.now())
    }
  }).render()
}