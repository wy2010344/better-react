import Better from './better-react'
import { useEffect, useState } from './better-react/fc';
import { useStoreTriggerRender, ValueCenter } from './better-react/ValueCenter';
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
    </> as JSX.Element
  );
}

let uid = 5
function ListApp() {
  const [state, setState] = Better.useState<number[]>([1, 2, 3])
  return <div>
    {state.map(v => {
      return <div key={v}>
        {v}
        <input />
        <button onClick={() => setState(state.filter(k => k != v))}>删除</button>
      </div>
    })}
    <button onClick={() => setState([uid++, ...state])}>add</button>
    <button onClick={() => {
      const newState = state.reverse()
      console.log("重排后", newState)
      setState([...newState])
    }}>重排</button>
  </div>
}
function App() {
  console.log("render app")
  const [show, setShow] = useState(true)
  return <div>
    <>
      <button onClick={() => setShow(!show)}>
        这是文字
      </button>
      {show ? <button style="transition:all ease 1s;" exit={function (it: any) {
        it.style.transform = 'translateX(100%)'
        return sleep(1000)
      }}>show</button> : <span>hidden</span>}
      <Counter />
    </>
    <Counter />
    <span />
    <Counter />
    <hr />
    <ListApp />
  </div>
}

function sleep(n: number) {
  return new Promise<void>(function (resolve) {
    setTimeout(resolve, n);
  })
}