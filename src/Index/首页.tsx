import { RouteFun, usePanel } from ".";
import { createElement } from 'better-react-dom'
import { Fragment } from 'better-react'
import PanelReact from "../drag/PanelReact";

const 首页: RouteFun<void> = ({
  close,
  moveToFirst
}) => {
  return <PanelReact
    title="首页"
    close={close}
    moveFirst={moveToFirst}
  >{x => {
    return <Page />
  }}</PanelReact>
}


function Page() {
  const { navigate } = usePanel()
  return <div>
    <div>
      <ul>
        <li>
          <button onClick={(e) => {
            e.stopPropagation()
            navigate("prolog", null)
          }}>进入prolog</button>
        </li>
        <li>
          <button onClick={(e) => {
            e.stopPropagation()
            navigate("测试createPortal", null)
          }}>测试createPortal</button>
        </li>
      </ul>
      <svg><rect style={{
        width: 100,
        height: 100,
        stroke: "black"
      }} /></svg>
    </div>
  </div>
}



export default 首页