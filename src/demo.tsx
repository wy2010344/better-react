import Better from './better-react'
import { useEffect, useState } from './better-react/fc';
import { useStoreTriggerRender, ValueCenter } from './better-react-helper/ValueCenter';
const store = ValueCenter.of(1)
function Counter({ group }: { group: string }) {
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
      <div style='border:1px solid gray;margin:10px;' >
        group {group} Count: {state}
        <button onClick={() => setState(state + 1)}>add</button>
        <button onClick={() => setState(state - 1)}>sub</button>
        <button onClick={() => setShow(!show)}>展示</button>
        {show && <Counter group={group + "--1"} />}
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
    {state.map((v, i) => {
      return <div key={v}>
        {v} {i}
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
export function Demo() {
  console.log("render app")
  const [show, setShow] = useState(true)
  return <div>
    <>
      <button onClick={() => setShow(!show)}>
        这是文字
      </button>
      {show ? <button style="transition:all ease 1s;" exit={function (it) {
        it.style.transform = 'translateX(100%)'
        return sleep(1000)
      }}>show</button> : <span>hidden</span>}
      <Counter group='1' />
      ceveef
    </>
    <Counter group='2' />
    <span />
    vds
    <Counter group='3' />
    vvvv
    <hr />
    <ListApp />
  </div>
}

function sleep(n: number) {
  return new Promise<void>(function (resolve) {
    setTimeout(resolve, n);
  })
}