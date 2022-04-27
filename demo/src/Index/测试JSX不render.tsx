import { createContext } from "better-react"
import { useState } from "better-react-helper"
import { RouteFun } from "."
import PanelReact from "../drag/PanelReact"

const 测试JSX不render: RouteFun<void> = ({ close, moveToFirst }) => {

  return <PanelReact
    title="测试JSX不render"
    close={close}
    moveFirst={moveToFirst}
    bodyCss={`
    flex-direction:column;
    `}
  >{x => {
    return <Page />
  }}</PanelReact>
}

export default 测试JSX不render


function Page() {

  const [first, setfirst] = useState(0)
  VMContext.useProvider(first)
  return <div>
    我是内容
    {inner}
    <button onClick={() => setfirst(first + 1)}>增加{first}</button>
  </div>
}

const VMContext = createContext(100)

function InnerPage() {
  console.log("render-子页面")
  return <div>
    这是子页面
    <SecondPage />
  </div>
}

const inner = <InnerPage />

function SecondPage() {
  const count = VMContext.useConsumer()

  console.log("render-子页面2222")
  return <div>
    这是内部的{count}内容
  </div>
}