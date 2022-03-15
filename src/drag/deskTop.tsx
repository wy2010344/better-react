import { useState } from '../better-react/fc'
import PanelMve from './PanelMve'
import Better from '../better-react'
import PanelReact from './PanelReact'
import { PortalCall, usePortals } from './panel'
export default function DeskTop() {


  /**
   * 外面是通过count控制的，所以无法去直接控制portals，排序与删除皆不能。。。
   * 正因如此，它与布局息息相关
   * 而不是动态添加无关的窗口数据——如果窗口作为数据，窗口不会受来源处的闭包render。
   */
  const [count, setCount] = useState(1)

  return <div style={{
    position: 'fixed',
    top: "0", left: 0,
    width: "100%",
    height: "100%"
  }}>
    <PortalHost />
    {Array(count).fill("").map((v, i) => {
      if (i % 2 == 0) {
        return <PortalCall key={i}>
          {index => <PanelMve key={index} index={index}>
            <div>我是文字 mve</div>
            <button onClick={() => setCount(count + 1)}>增加</button>
          </PanelMve>}
        </PortalCall>
      } else {
        return <PortalCall key={i}>
          {index => <PanelReact key={index} index={index}>{({ }) => <>
            <div css={`
            background:red;
            :hover{
              background:white;
            }
            color:green;
            margin-left:${count * 10}px;
            `}>我是文字 react</div>
            <button onClick={() => setCount(count + 1)}>增加</button>
          </>}
          </PanelReact>}
        </PortalCall>
      }
    })}
  </div>
}

function PortalHost() {
  const protals = usePortals()
  return <>
    {protals}
  </>
}
