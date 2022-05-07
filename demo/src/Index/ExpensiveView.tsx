import { flushSync, startTransition, useMemo } from "better-react";
import { useConstRef, useRef, useState, useRefValue } from "better-react-helper";
import { RouteFun } from ".";
import PanelReact from "../drag/PanelReact";




const ExpensivePanel: RouteFun<void> = ({ close, moveToFirst }) => {
  return <PanelReact moveFirst={moveToFirst}
    initWidth={800}
    close={close} title="popover">{x => {
      return <>
        <App />
      </>
    }}</PanelReact>
}
export default ExpensivePanel

function App() {
  const [value, setValue] = useState(0);
  const [isStartTransition, setIsStartTransition] = useState(false);
  const [renderValue, setRenderValue] = useState(0);

  const abc = useMemo(() => {
    console.log("执行了memo")
    return 9
  }, [])

  //const [isPending, startTransition] = useTransition();

  const view = useMemo(() => <ExpensiveView count={renderValue} />, [renderValue])
  console.log("render....", value, renderValue)
  return (
    <div className="App" css={`overflow:auto;`}>
      <div className="app-content">
        <label>
          <input
            type="checkbox"
            checked={isStartTransition}
            onChange={(e) => {
              setIsStartTransition(e.target.checked);
            }}
          />
          useTransition
        </label>
        <h3>
          input:{value} {
            //isPending ? " Loading..." : null
          }
        </h3>
        <input
          type="range"
          min="0"
          max="600"
          step="1"
          value={value}
          onInput={e => {
            const v = (e.target as any).value!
            //console.log("change", v)
            const value = Number(v)
            setValue(value);
            if (isStartTransition) {
              startTransition(() => {
                setRenderValue(value / 1);
              });
            } else {
              setRenderValue(value / 1);
            }
          }}
        />
        <hr />
        {view}
        {/* <ExpensiveView count={renderValue} /> */}
      </div>
    </div>
  );
}

function ExpensiveView({
  count
}: {
  count: number
}) {
  const length = count * 20 + 1000;
  const ref = useRef<HTMLDivElement | undefined>(undefined)
  return (
    <div className="expensive-view" ref={ref}>
      <h4>DIV count:{length}</h4>
      <button onClick={(e) => {
        e.stopPropagation()
        console.log("length", ref()?.childNodes.length)
        const childrens = ref()?.childNodes
        if (childrens) {
          const pool = new Map<string, number>()
          childrens.forEach(v => {
            const text = (v as any).innerText
            if (pool.has(text)) {
              pool.set(text, (pool.get(text) || 0) + 1)
            } else {
              pool.set(text, 0)
            }
          })
          const vs = []
          for (const entity of pool.entries()) {
            vs.push(entity)
          }
          console.log(vs.sort((a, b) => b[1] - a[1]))
        }
      }}>当前子元素</button>
      {Array.from(Array(length).keys()).reverse().map((v) => {
        const style = {
          backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(
            16
          )}`,
          display: "inline-block",
          width: "50px",
          height: "50px",
          margin: "2px"
        };
        return <div className="box" key={v} style={style}>{v}</div>;
      })}
    </div>
  );
}

export function useEvent<T extends (...vs: any[]) => any>(fun: T): T {
  const ref = useRefValue(delegateFun)()
  ref.setCurrent(fun)
  return ref.run as T
}

function delegateFun<T extends (...vs: any[]) => any>() {
  let current: T
  const run: T = function () {
    return current.apply(null, arguments as any)
  } as T
  return {
    setCurrent(f: T) {
      current = f
    },
    run
  }
}