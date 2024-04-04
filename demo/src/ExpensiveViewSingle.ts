import { startTransition } from "better-react";
import { dom, renderContent } from "better-react-dom";
import { useEvent, useState, renderArray, renderFragment, useMemo, useAtom, useChgAtom, useEffect } from "better-react-helper";
import { renderInput } from "better-react-dom-helper";
import { stringifyStyle } from "wy-dom-helper";

let lastRenderTime = performance.now()

let rollbackTime = 0
export default function () {
  const [value, setValue] = useState(0);
  const [renderValue, setRenderValue] = useState(0);


  const [onTrans, setOnTrans] = useState(false)
  //const testValue = useSyncExternalStore(testStore.subscribe, testStore.get)
  const abcValue = useMyExternal(abcStore.subscribe, abcStore.get)
  useMemo(() => {
    console.log("改变了trans", onTrans, "----abc---", abcValue, abcStore.get())
    return Date.now()
  }, [onTrans])



  useEffect(() => {
    const tim = performance.now()
    console.log("timeReq", tim - oldTim)
    oldTim = tim
  })


  const timeRef = useAtom(0)
  const chgTimeRef = useChgAtom(0)
  timeRef.set(timeRef.get() + 1)
  chgTimeRef.set(chgTimeRef.get() + 1)
  rollbackTime = rollbackTime + 1

  const [isPending, startTransition] = useTransition()
  const [transition, setTransition] = useState(false)
  const thisRenderTime = performance.now()
  //console.log("render-", thisRenderTime - lastRenderTime)
  lastRenderTime = thisRenderTime

  const [avCount, setAvCount] = useState(9)
  useEffect(() => {
    setAvCount(v => v + 1)
  }, [onTrans])

  useEffect(() => {
    console.log(`回滚次数${timeRef.get()} ---${chgTimeRef.get()}---${rollbackTime}`)
  })
  dom.div({

  }).renderText`回滚次数${timeRef.get()} ---${chgTimeRef.get()}---${rollbackTime}`
  dom.div({
    style: stringifyStyle({
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    })
  }).renderFragment(function () {
    dom.div().renderFragment(function () {
      const checkbox = dom.input({
        type: "checkbox",
        onInput(e) {
          const input = e.target as HTMLInputElement
          setTransition(input.checked)
        }
      }).render()
      //console.log("reco...", checkbox.checked)
      useEffect(() => {
        checkbox.checked = transition
        //console.log(checkbox.checked, transition)
      }, [transition])
      function changeValue(v: string) {
        const value = Number(v)
        setValue(value);
        if (transition) {
          startTransition(() => {
            setRenderValue(value)
            setOnTrans(v => !v)
            abcStore.set(abcValue + 1)
            //testStore.set(testValue + 1)
          })
        } else {
          setRenderValue(value)
        }
      }
      renderInput("input", {
        value: value + '',
        type: "range",
        min: 0,
        max: 600,
        step: 1,
        onValueChange(v) {
          changeValue(v)
        },
      })
      renderInput("input", {
        type: "range",
        min: 0,
        max: 600,
        step: 1,
        value: value + '',
        onValueChange(v) {
          changeValue(v)
        }
      })
      renderContent(`${value}`)
      const select = dom.select().renderFragment(function () {
        dom.option({
          value: 8
        }).renderText`8`
        dom.option({
          value: 9
        }).renderText`9`
        dom.option({
          value: 7
        }).renderText`7`

      })
      useEffect(() => {
        select.value = "7"
      }, [])
      renderContent(`改变内部值${onTrans ? "A" : "B"}外部存储值${avCount}---abc---${abcValue}`)
    })
    dom.div().renderTextContent(isPending ? `正在进行中...` : '')
    dom.hr().render()
    dom.div({
      style: stringifyStyle({
        flex: "1",
        overflow: "auto"
      }),
    }).renderFragment(function () {

      renderFragment(() => {
        ExpensiveView(renderValue)
      }, [renderValue])
    })
  })
}

let oldTim = 0
function ExpensiveView(count: number) {
  //console.log("render-内部-ExpensiveView")
  const length = count * 20 + 1000;
  const div = dom.div().renderFragment(function () {
    dom.button({
      onClick(e) {
        e.stopPropagation()
        console.log(div.childNodes.length)
      },
    }).renderText`内容 ${length}`

    renderFragment(PartView, [])
    dom.hr().render()
    //console.log("render-mvvvv")
    renderArray(
      Array.from(Array(length).keys()).reverse(),
      v => v,
      v => {
        const style = {
          backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(
            16
          )}`,
          display: "inline-block",
          width: "50px",
          height: "50px",
          margin: "2px"
        };
        dom.div({

          style: stringifyStyle(style),
        }).renderTextContent(`${v}`)
      })
  })
}

export function useTransition() {
  const [isPending, setIsPending] = useState(false)

  return [isPending, function (fun: () => void) {
    setIsPending(true)
    startTransition(function () {
      fun()
      setIsPending(false)
    })
  }] as const
}

function PartView() {
  //const testValue = useSyncExternalStore(testStore.subscribe, testStore.get)
  const vvValue = useMyExternal(abcStore.subscribe, abcStore.get)
  dom.div().renderText`内部读取{ testValue } --- abc-- - ${vvValue}`
}

function createTestStore() {
  const pool = new Set<() => void>()
  let value = 9
  return {
    get() {
      return value
    },
    set(v: number) {
      value = v
      pool.forEach(run => run())
    },
    subscribe(run: () => void) {
      pool.add(run)
      return () => {
        pool.delete(run)
      }
    }
  }
}
const testStore = createTestStore()
const abcStore = createTestStore()

function useMyExternal<T>(subscribe: (fun: () => void) => () => void, getValue: () => T): T {
  const [value, setValue] = useState<T>(getValue())
  const notify = useEvent(() => {
    const v = getValue()
    if (v != value) {
      setValue(v)
    }
  })
  useEffect(() => {
    return subscribe(notify)
  }, [])
  return value
}