import { createSharePortal } from '../better-react-helper/SharePortal'
import { useState } from '../better-react/fc'
import PanelMve from './PanelMve'
import Better from '../better-react'
import PanelReact from './PanelReact'

const { Portal, usePortals } = createSharePortal()
export default function DeskTop() {


  const [count, setCount] = useState(1)

  return <div style={`
  position:fixed;
  top:0;left:0;
  width:100%;height:100%;
  `}>
    <PortalHost />
    {Array(count).fill("").map((v, i) => {

      if (i % 2 == 0) {

        return <Portal key={i}>
          <PanelMve>
            <div>我是文字 mve</div>
            <button onClick={() => setCount(count + 1)}>增加</button>
          </PanelMve>
        </Portal>
      } else {

        return <Portal key={i}>
          <PanelReact>
            <div>我是文字 react</div>
            <button onClick={() => setCount(count + 1)}>增加</button>
          </PanelReact>
        </Portal>
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
