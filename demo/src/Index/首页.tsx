import { RouteFun, usePanel } from ".";
import { createElement } from 'better-react-dom'
import { BRFun, BRNode, Fragment } from 'better-react'
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


const Page: BRFun<{ key: boolean }> = (prp) => {
  console.log("pro", prp)
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
        <li css="">
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

      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="currentColor" css={`
        color:green;
        width:30px;
        height:30px;
      `}>
        <path fill="#D9D9D9" d="M240.9 393.9h542.2L512 196.7z" />
        <path d="M894 462c30.9 0 43.8-39.7 18.7-58L530.8 126.2a31.81 31.81 0 0 0-37.6 0L111.3 404c-25.1 18.2-12.2 58 18.8 58H192v374h-72c-4.4 0-8 3.6-8 8v52c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-52c0-4.4-3.6-8-8-8h-72V462h62zM381 836H264V462h117v374zm189 0H453V462h117v374zm190 0H642V462h118v374zM240.9 393.9L512 196.7l271.1 197.2H240.9z" />
      </svg>

    </div>
  </div>
}



export default 首页