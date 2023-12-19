import { dom } from "better-react-dom";
import { cns, css } from "better-react-dom-helper";
import { useVersion } from "better-react-helper";

export function render动画测试() {
  const [version, updateVersion] = useVersion()
  const [version2, updateVersion2] = useVersion()
  dom.button({
    onClick() {
      updateVersion()
    }
  }).text`左右动画`

  dom.button({
    onClick() {
      updateVersion2()
    }
  }).text`停启动画`
  dom.div({
    className: cns(cls, version % 2 ? 'left' : 'right', version2 % 2 ? 'animation' : ''),
    onTransitionCancel() {
      /**
       * 只要造成动画的关键类丢失,都会出现cancel
       * 即起transition那个类
       */
      console.log("cancel")
    },
    onTransitionEnd() {
      console.log("end")
    }
  }).render()
}

const cls = css`
width:300px;
height:300px;
background-color: green;
&.left{
  transform: translateX(-100%);
}
&.right{
  transform: translateX(100%);
}
&.center{
  transform: translateX(0);
}
&.animation{
  transition: all ease 3s;
}
`