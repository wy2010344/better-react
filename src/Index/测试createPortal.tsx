import Better, { createPortal } from '../better-react'
import { RouteFun } from '.'
import PanelReact from '../drag/PanelReact'
import { useEffect, useState } from '../better-react/fc'

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

  return <>
    <button onClick={() => stateValue(state - 1)}>文字--</button>
    {createPortal(showPortal && state < 3 ? <div>
      我是追加 {state}
      <TestView />
      <button onClick={() => stateValue(state + 1)}>文字++</button>
    </div> : undefined, document.body)}

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
