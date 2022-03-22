
import { createElement } from '../better-react-dom'
import { createPortal, Fragment, useEffect, useMemo } from 'better-react'
import { RouteFun } from '.'
import PanelReact from '../drag/PanelReact'
import { FiberNode } from '../better-react-dom/updateDom'
import { useState } from '../better-react-helper/useState'

const 测试createPortal: RouteFun<void> = ({ close, moveToFirst }) => {

  return <PanelReact
    title="首页"
    close={close}
    moveFirst={moveToFirst}
  >{x => {
    return <Page />
  }}</PanelReact>
}

function Page() {

  const [state, stateValue] = useState(0)
  const [showPortal, setShowPortal] = useState(true)
  useEffect(() => {
    return () => {
      console.log("全部销毁")
      setShowPortal(false)
    }
  }, [])

  const aa = useMemo(() => {
    console.log("计算memo", state)
    return state
  }, [state])
  return <>
    <button onClick={() => stateValue(state - 1)}>文字--{aa}</button>
    <button onClick={() => setShowPortal(!showPortal)}>切换portal</button>
    {createPortal(showPortal && state < 3 ? <div>
      我是追加 {state}
      <TestView />
      <button onClick={() => stateValue(state + 1)}>文字++</button>
    </div> : undefined, FiberNode.create(document.body))}

    <div>{Array(state).fill("").map((_, i) => {
      return <div>测试{i}</div>
    })}</div>
  </>
}

function TestView() {
  useEffect(() => {
    console.log("初始化")
    return () => {
      console.log("销毁")
    }
  }, [])
  return <div>这里</div>
}

export default 测试createPortal
