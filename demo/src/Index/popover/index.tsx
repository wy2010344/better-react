import { RouteFun } from "..";
import PanelReact from "../../drag/PanelReact";
import { Fragment, useEffect } from "better-react";
import { createElement } from "better-react-dom";
import { useRef, useState } from "better-react-helper";
import { Alignment, computePosition, waitUntilQuit, Direction, foreverCheck, CheckCallBack, ArrowLocation, opsiteDirection } from "./computePosition";


const popover: RouteFun<void> = ({ close, moveToFirst }) => {
  return <PanelReact moveFirst={moveToFirst}
    initWidth={800}
    close={close} title="popover">{x => {
      return <>
        <PopView />
      </>
    }}</PanelReact>
}
export default popover

function PopView() {
  const [show, setShow] = useState(false)
  const [count, setCount] = useState(0)

  const [alignment, setAlignment] = useState<Alignment>("start")
  const [direction, setDirection] = useState<Direction>("left")
  const portalRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)
  const [arrowLocation, setArrowLocation] = useState<ArrowLocation>({
    zeroDirection: "left",
    offsetDirection: "left",
    offset: 0
  })
  // const checkCallBack: CheckCallBack =
  // const checkCallBackRef = useRef(checkCallBack)
  // checkCallBackRef(checkCallBack)
  useEffect(() => {
    const portal = portalRef()
    console.log(portal)
    const button = buttonRef()
    let destroy: (() => void) | undefined = undefined
    if (show && portal && button) {
      // delayCheck(
      //   () => button.getBoundingClientRect(),
      //   () => portal.getBoundingClientRect(),
      //   waitRequestAnimation
      // ).then(({ target, popover }) => {
      //   console.log("稳定不变了", target, popover)
      //   const { left, top } = computePosition(target, popover, direction, alignment)
      //   setLeft(left)
      //   setTop(top)
      // })
      destroy = foreverCheck(
        () => button.getBoundingClientRect(),
        () => portal.getBoundingClientRect(),
        waitRequestAnimation,
        ({ target, popover }) => {
          console.log("稳定不变了", target, popover)
          const position = computePosition(target, popover, direction, alignment)
          const { top, left } = position.getTopLeft(10)
          setArrowLocation(position.getArrowOffset())
          setLeft(left)
          setTop(top)
        }
      )
    }
    return function () {
      destroy?.()
    }
  }, [show, direction, alignment])

  return <div>
    <button onClick={(e) => {
      setShow(!show)
    }}>点击</button>
    <button onClick={(e) => {
      setCount(count + 1)
      const portal = portalRef()
      console.log(portal)
      const button = buttonRef()
      if (show && portal && button) {
        const rect = button.getBoundingClientRect()
        const portalRect = portal.getBoundingClientRect()
        console.log(portal.children.length)
        console.log(rect, portalRect)
      }
    }}>增加</button>
    <div ref={buttonRef} css={`
      width:100px;
      height:100px;
      background:grey;
    `}></div>
    {
      show && <div ref={portalRef} portalTarget={() => document.body} className={`cfc${count}`} css={`
        background: red;
        position: absolute;
        left: ${left}px;
        top: ${top}px;
      `}
        onClick={() => {
          console.log("dg")
        }}>
        <div css={`
      position:absolute;
      ${arrowLocation.zeroDirection}:-10px;
      ${arrowLocation.offsetDirection}:${arrowLocation.offset - 5}px;
      color:white;
      width: 0;
      height: 0;
      border: 5px solid;
      border-color:transparent;
      border-${opsiteDirection(arrowLocation.zeroDirection)}-color:green;
      `} />
        <div>我是内容</div>
        <div>ddd</div>
      </div>
    }
    <div css={`
      position:absolute;
      bottom:0px;
    `}>
      <div >
        {directions.map(v => (
          <button key={v} css={`
          background:${direction == v ? 'grey' : ''};
          `}
            onClick={() => setDirection(v)}>{v}</button>
        ))}
      </div>
      <div>
        {aligments.map(v => (
          <button key={v} css={`
          background:${alignment == v ? 'grey' : ''};
          `} onClick={() => setAlignment(v)}>{v}</button>
        ))}
      </div>
    </div>
  </div >
}

const directions: Direction[] = ['left', 'right', 'top', 'bottom']
const aligments: Alignment[] = ['start', 'center', 'end']


function waitRequestAnimation() {
  return new Promise(resolve => {
    requestAnimationFrame(resolve)
  })
}

function wait(n: number) {
  return new Promise(resolve => {
    setTimeout(resolve, n)
  })
}