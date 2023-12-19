import { dom } from "better-react-dom";
import { cns, css, useInitClassNames } from "better-react-dom-helper";
import { renderIf, useVersion } from "better-react-helper";

export function render内置入场动画() {
  const [version, updateVersion] = useVersion()
  dom.button({
    onClick() {
      updateVersion()
    }
  }).text`入场`

  dom.button({
    onClick() {
      // 创建新元素
      const newElement = document.createElement('div');
      // 将新元素添加到 body 中
      container.appendChild(newElement);
      newElement.className = cns(cls, 'init')
      // 强制浏览器重新渲染，以触发动画
      // newElement.offsetHeight;
      newElement.scrollTop;
      // 触发 CSS3 动画
      newElement.className = cns(cls, 'show')
    }
  }).text`手动入场`
  const container = dom.div().render(function () {

    renderIf(version % 2, function () {
      useInitClassNames(() => div, 'show', 'init')
      const div = dom.div({
        className: cns(cls, 'show'),
        onTransitionCancel() {
          console.log("onTransitionCancel", "cancel")
        },
        onTransitionEnd() {
          console.log("onTransitionEnd", "end")
        }
      }).render()
    })
  })
}

const cls = css`
width:100px;
height:100px;
background-color: red;
&.show{
  transform: translateX(0);
  transition: all ease 1s;
}
&.init{
  transform: translateX(-100%);
}
`