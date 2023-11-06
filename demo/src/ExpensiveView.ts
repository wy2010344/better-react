import { startTransition, useEffect } from "better-react";
import { renderContent, useDom } from "better-react-dom";
import { useEvent, useState, renderArray, renderFragment, useMemo } from "better-react-helper";
import { normalPanel } from "./panel/PanelContext";
import { renderInput, stringifyStyle } from "better-react-dom-helper";

let lastRenderTime = performance.now()

export default normalPanel(function (operate, id) {
  const [value, setValue] = useState(0);
  const [renderValue, setRenderValue] = useState(0);


  const [onTrans, setOnTrans] = useState(false)
  //const testValue = useSyncExternalStore(testStore.subscribe, testStore.get)
  const abcValue = useMyExternal(abcStore.subscribe, abcStore.get)
  useMemo(() => {
    console.log("改变了trans", onTrans, "----abc---", abcValue, abcStore.get())
    return Date.now()
  }, [onTrans])


  const [isPending, startTransition] = useTransition()
  const [transition, setTransition] = useState(false)
  const thisRenderTime = performance.now()
  //console.log("render-", thisRenderTime - lastRenderTime)
  lastRenderTime = thisRenderTime

  const [avCount, setAvCount] = useState(9)
  useEffect(() => {
    setAvCount(v => v + 1)
  }, [onTrans])

  useDom("div", {
    style: stringifyStyle({
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }),
    children() {
      useDom("div", {
        children() {
          const checkbox = useDom("input", {
            type: "checkbox",
            onInput(e) {
              const input = e.target as HTMLInputElement
              setTransition(input.checked)
            }
          })
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
          const select = useDom("select", {
            children() {
              useDom("option", {
                value: 9,
                children() {
                  renderContent("9")
                }
              })
              useDom("option", {
                value: 8,
                children() {
                  renderContent("8")
                }
              })
              useDom("option", {
                value: 7,
                children() {
                  renderContent("7")
                }
              })
            }
          })
          useEffect(() => {
            select.value = "7"
          }, [])
          renderContent(`改变内部值${onTrans ? "A" : "B"}外部存储值${avCount}---abc---${abcValue}`)
        }
      })
      useDom("div", {
        textContent: isPending ? `正在进行中...` : ''
      })
      useDom("hr")
      useDom("div", {
        style: stringifyStyle({
          flex: "1",
          overflow: "auto"
        }),
        children() {

          renderFragment(() => {
            ExpensiveView(renderValue)
          }, [renderValue])
        }
      })
    }
  })
})

function ExpensiveView(count: number) {

  //console.log("render-内部-ExpensiveView")
  const length = count * 20 + 1000;
  const div = useDom("div", {
    children() {
      useDom("button", {
        onClick(e) {
          e.stopPropagation()
          console.log(div.childNodes.length)
        },
        children() {
          renderContent(`内容 ${length}`)
        }
      })

      renderFragment(PartView, [])
      useDom("hr")
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
          useDom("div", {
            style: stringifyStyle(style),
            children() {
              renderContent(`${v}`)
            }
          })
        })
    }
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
  useDom("div", {
    children() {
      renderContent(`内部读取{ testValue } --- abc-- - ${vvValue}`)
    }
  })
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