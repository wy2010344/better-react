import Better from './better-react'
import { useEffect } from './better-react/fc';
import { useStoreTriggerRender, ValueCenter } from './better-react/ValueCenter';
import './style.css'

const store = new ValueCenter(1)
function Counter() {
  const [state, setState] = Better.useState(1);
  const [show, setShow] = Better.useState(false)
  const value = useStoreTriggerRender(store)
  console.log("render", state)
  useEffect(function () {
    console.log(`初始${state}`)
    return function () {
      console.log(`销毁${state}`)
    }
  }, [state])
  return (
    <>
      <div >
        Count: {state}
        <button onClick={() => setState(state + 1)}>add</button>
        <button onClick={() => setState(state - 1)}>sub</button>
        <button onClick={() => setShow(!show)}>展示</button>
        {show && <Counter />}
      </div>
      <div >
        共享{value}
        <button onClick={() => store.set(value + 1)}>增加共享</button>
      </div>
    </>
  );
}

let uid = 0
function ListApp() {
  const [state, setState] = Better.useState<number[]>([])
  return <div>
    {state.map(v => {
      return <div key={v}>{v}</div>
    })}
    <button onClick={() => setState([uid + 1, ...state])}>add</button>
  </div>
}
function App() {
  console.log("render app")
  return <div>
    <>
      <button>
        这是文字
      </button>
      <Counter />

    </>
    <Counter />
    <span />
    <Counter />
    <hr />
    {/* <ListApp /> */}
  </div>
}

Better.render(<App />, document.getElementById("app")!);