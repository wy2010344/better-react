import { dom } from "better-react-dom";
import { FAnimateTime, renderOneFAnimateTime, renderOneTAnimate } from "better-react-dom-helper";
import { useChange, useVersion } from "better-react-helper";

export function renderSinglePage() {

  const [show, setShow] = useChange(true)
  const [direction, setDirection] = useChange<'left' | 'right' | 'top' | 'bottom'>('left')

  const [version, updateVersion] = useVersion()
  dom.button({
    onClick() {
      setShow(!show)
    }
  }).text`${show ? '隐藏' : '展示'}`
  dom.button({
    onClick() {
      setDirection('left')
    }
  }).text`向左`
  dom.button({
    onClick() {
      setDirection('right')
    }
  }).text`向右`
  dom.button({

    onClick() {
      setDirection('top')
    }
  }).text`向上`
  dom.button({
    onClick() {
      setDirection('bottom')
    }
  }).text`向下`

  dom.button({
    onClick() {
      updateVersion()
    }
  }).text`version`

  dom.span().text`${direction}`
  dom.div({
    style: `
    width:100%;
    aspect-ratio:1/1;
    position:relative;
    display:flex;
    align-items:center;
    justify-content:center;
    perspective:1000px;
    `
  }).render(function () {

    let style: FAnimateTime<string> | undefined = undefined

    console.log("dd", direction)
    if (show) {
      if (direction == 'left') {
        style = {
          from: `transform:translateX(-300px);`,
          show: `transform:translateX(-100px);`,
          exit: `transform:translateX(-300px);`,
          timeout: 500
        }
      } else if (direction == 'right') {
        style = {
          from: `transform:translateX(300px);`,
          show: `transform:translateX(100px);`,
          exit: `transform:translateX(300px)`,
          timeout: 500
        }
      } else if (direction == 'top') {
        style = {
          from: `transform:translateY(-300px);`,
          show: `transform:translateY(-100px);`,
          exit: `transform:translateY(-300px);`,
          timeout: 500
        }
      } else if (direction == 'bottom') {
        style = {
          from: `transform:translateY(300px);`,
          show: `transform:translateY(100px);`,
          exit: `transform:translateY(300px);`,
          timeout: 500
        }
      }
    }
    renderOneFAnimateTime<string>(style, {
      customExit: {
        exit: version % 2 ? `transform:translateZ(-1000px);` : `scale:2;`
      }
    }, function (v) {
      console.log(v)
      dom.div({
        style: `
width:200px;
height:200px;
background:green;
transition:all ease 0.5s;
${v}
`
      }).render()
    })
  })
}