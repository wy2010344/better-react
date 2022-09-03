import { useFragment, useMap, useMemo, useState, startTransition, useEffect } from "better-react";
import { React, useContent, useDom } from "better-react-dom";
import { useEvent, useRef } from "better-react-helper";
import { normalPanel } from "./panel/PanelContext";
import useInput from "./useInput";

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


  const [transition, setTransition] = useState(false)
  const thisRenderTime = performance.now()
  //console.log("render-", thisRenderTime - lastRenderTime)
  lastRenderTime = thisRenderTime

  const [avCount, setAvCount] = useState(9)
  useEffect(() => {
    setAvCount(v => v + 1)
  }, [onTrans])

  const view = useMemo(() => {
    return () => {
      ExpensiveView(renderValue)
    }
  }, [renderValue])

  useDom("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    },
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
          const range = useDom("input", {
            type: "range",
            min: 0,
            max: 600,
            step: 1,
            onChange(e) {
              //console.log(range.value)
              const input = e.target as HTMLInputElement
            },
            onInput(e) {
              const v = (e.target as any).value!
              //console.log("change", v)
              changeValue(v)
              e.preventDefault()
            }
          })
          useEffect(() => {
            range.value = "" + value
          }, [value])
          useInput("input", {
            type: "range",
            min: 0,
            max: 600,
            step: 1,
            value: value + '',
            onValueChange(v) {
              changeValue(v)
            }
          })
          useContent(`${value}`)
          const select = useDom("select", {
            children() {
              useDom("option", {
                value: 9,
                children() {
                  useContent("9")
                }
              })
              useDom("option", {
                value: 8,
                children() {
                  useContent("8")
                }
              })
              useDom("option", {
                value: 7,
                children() {
                  useContent("7")
                }
              })
            }
          })
          useEffect(() => {
            select.value = "7"
          }, [])
          useContent(`改变内部值${onTrans ? "A" : "B"}外部存储值${avCount}---abc---${abcValue}`)
        }
      })
      useDom("hr", {})
      useDom("div", {
        style: {
          flex: "1",
          overflow: "auto"
        },
        children() {
          useFragment(view)
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
          useContent(`内容 ${length}`)
        }
      })

      useFragment(PartView)
      useDom("hr")
      //console.log("render-mvvvv")
      useMap(
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
            style,
            children() {
              useContent(`${v}`)
            }
          })
        })
    }
  })
}

function PartView() {
  //const testValue = useSyncExternalStore(testStore.subscribe, testStore.get)
  const vvValue = useMyExternal(abcStore.subscribe, abcStore.get)
  useDom("div", {
    children() {
      useContent(`内部读取{ testValue } --- abc-- - ${vvValue}`)
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