import Better from './better-react'
import Panel from './Panel';
import './style.css'


function App() {
  return <div style={`
  position:fixed;
  top:0;left:0;
  width:100%;height:100%;
  `}>
    <Panel>
      <div>我是文字</div>
    </Panel>
  </div>
}

Better.render(<App />, document.getElementById("app")!);