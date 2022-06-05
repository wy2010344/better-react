import { flushSync, useFragment, useMap, useMemo, useState } from "better-react";
import { DomElements, React, useContent, useDom } from "better-react-dom";
import { useRef, useRefValue } from "better-react-helper";

export default function index() {
  useContent("1")
  useContent("2")
  useContent("3")
  useContent("4")
  useFragment(simpleButton, '1')
  useFragment(simpleButton, '2')
  useFragment(simpleButton, '3')
  useFragment(simpleButton, '4')
  //testInnerFragment()
  // useContent("----")
  // useDom("hr")
  // testIncrease()
  //testcIncrease()
  // useFragment(testIncrease)
  MapList()

  testFlushSync()
}


function testFlushSync() {
  const [value, setValue] = useState(1)
  const input = useRef<HTMLInputElement | null>(null)
  useDom("div", {
    children() {
      useDom("input", {
        value,
        type: "number",
        ref(e) {
          input.set(e)
        },
        onInput(e) {
          const input = e.target as HTMLInputElement
          setValue(Number(input.value))
        }
      })
      useDom("button", {
        onClick() {
          flushSync(() => {
            setValue(v => v + 1)
          })
          console.log(input.get()?.value)
        },
        children() {
          useContent("设置值")
        }
      })
    }
  })
}

function simpleButton(v: string) {
  useContent(v)
}

function testInnerFragment() {
  useDom("div", {
    children() {
      useDom("div", {
        children() {
          useFragment(simpleButton, '1')
          useFragment(simpleButton, '2')
          useFragment(simpleButton, '3')
          useFragment(simpleButton, '4')
        }
      })
    }
  })
}

function testIncrease() {
  const [count, setCount] = useState(0)
  console.log("render-自身")
  useDom("div", {
    children() {
      useDom("button", {
        onClick() {
          setCount(count + 1)
        },
        children() {
          useContent("增加")
        }
      })
      useContent(`值${count}`)
      useDom("button", {
        onClick() {
          setCount(count - 1)
        },
        children() {
          useContent("减少")
        }
      })
    }
  })
}

function testcIncrease() {
  console.log("render-自身c")
  const [count, setCount] = useState(0)
  useDom("div", {
    children() {
      useDom("button", {
        onClick() {
          setCount(count + 1)
        },
        children() {
          useContent("增c加")
        }
      })
      useContent(`值${count}`)
      useDom("button", {
        onClick() {
          setCount(count - 1)
        },
        children() {
          useContent("减c少")
        }
      })
    }
  })
}


function MapList() {

  const [list, setList] = useState<{
    index: number,
    key: string
  }[]>(() => [])
  useMap(list, v => v.index, (row, i) => {
    useDom("div", {
      children() {
        useDom("div", {
          children() {
            useContent(`我是内容${row.index}---${row.key}`)
          }
        })
        useDom("input")

        useDom("button", {
          onClick() {
            list.splice(i, 1)
            setList([...list])
            console.log(list, i)
          },
          children() {
            useContent("删除")
          }
        })
      }
    })
  })

  useDom("button", {
    onClick(e) {
      list.unshift({
        index: list.length,
        key: "vvv" + list.length
      })
      setList([...list])
      console.log(list)
      e.stopPropagation()
    },
    children() {
      useContent("增加列表")
    }
  })
}