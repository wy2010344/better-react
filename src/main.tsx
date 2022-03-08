import Better from './better-react'
import { createSharePortal } from './better-react-helper/SharePortal';
import { useState } from './better-react/fc';
import Panel from './Panel';
import './style.css'



const { Portal, usePortals } = createSharePortal()
function App() {


  const protals = usePortals()

  console.log(protals, "dxxx")

  const [count, setCount] = useState(1)

  return <div style={`
  position:fixed;
  top:0;left:0;
  width:100%;height:100%;
  `}>
    {protals}

    {Array(count).fill("").map((v, i) => {
      console.log("tap", i)
      return <Portal key={i}>
        <Panel>
          <div>我是文字</div>
          <div onClick={() => setCount(count + 1)}>增加</div>
        </Panel>
      </Portal>
    })}
  </div>
}

Better.render(<App />, document.getElementById("app")!);