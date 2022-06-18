import { useFragment, useMap, useMemo, useState, startTransition, useEffect } from "better-react";
import { React, useContent, useDom } from "better-react-dom";
import { useRef } from "better-react-helper";
import { normalPanel } from "./panel/PanelContext";

let lastRenderTime = performance.now()
export default normalPanel(function (operate, id) {
  const [value, setValue] = useState(0);
  const [renderValue, setRenderValue] = useState(0);

  const [transition, setTransition] = useState(false)
  const thisRenderTime = performance.now()
  console.log("render-", thisRenderTime - lastRenderTime)
  lastRenderTime = thisRenderTime

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
          useDom("input", {
            type: "checkbox",
            checked: transition,
            onInput(e) {
              const input = e.target as HTMLInputElement
              setTransition(input.checked)
            }
          })
          const rangeFiber = useDom("input", {
            type: "range",
            min: 0,
            max: 600,
            step: 1,
            value,
            onChange(e) {
              console.log(rangeFiber.dom.node!.value)
              const input = e.target as HTMLInputElement
            },
            onInput(e) {
              const v = (e.target as any).value!
              //console.log("change", v)
              const value = Number(v)
              setValue(value);
              if (transition) {
                startTransition(() => {
                  setRenderValue(value)
                })
              } else {
                setRenderValue(value)
              }
              e.preventDefault()
            }
          })
          useContent(`${value}`)
          useDom("select", {
            value: 7,
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

  console.log("render-内部-ExpensiveView")
  const length = count * 20 + 1000;
  const ref = useRef<HTMLDivElement | null>(null)
  useDom("div", {
    ref(e) {
      ref.set(e as any)
    },
    children() {
      useDom("button", {
        onClick(e) {
          e.stopPropagation()
          console.log(ref.get()?.childNodes.length)
        },
        children() {
          useContent(`内容 ${length}`)
        }
      })
      useDom("hr")
      console.log("render-mvvvv")
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