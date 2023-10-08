import { DomElementType, renderContent, useDom } from "better-react-dom";
import { useRef, renderArray, renderIf, useState } from "better-react-helper";
import { usePortalPanel } from "../panel/PanelContext";

export default function index() {
  renderContent("1")
  renderContent("2")
  renderContent("3")
  renderContent("4")
  //testInnerFragment()
  // renderContent("----")
  // useDom("hr")
  // testIncrease()
  //testcIncrease()
  // renderFragment(testIncrease)
  MapList()

  testFlushSync()
  Demo2()
  testPortalPanel()
}
function useRenderCount(prefix: string) {
  const renderCount = useRef(0)
  renderCount.set(renderCount.get() + 1)
  console.log(prefix, "重新渲染", renderCount.get())
}

function Demo2() {
  useRenderCount("主")
}

function testPortalPanel() {
  const [showRoot, setShowRoot] = useState(false)
  useDom("button", {
    onClick() {
      setShowRoot(true)
    },
    children() {
      renderContent("进入portal")
    }
  })
  renderIf(showRoot, () => {
    usePortalPanel({
      close() {
        setShowRoot(false)
      },
      children() {
        renderContent("这是window级的portal")

        testPortalPanel()
        testChangeValue()
      }
    })
  })
}

function testChangeValue() {
  const [value, setValue] = useState<DomElementType>("div")

  useDom(value, {
    children() {
      useDom("button", {
        onClick() {
          setValue(value == "div" ? "pre" : "div")
        },
        children() {
          renderContent("点击切换")
        }
      })
    }
  })
}

function testFlushSync() {
  const [value, setValue] = useState(1)
  const input = useRef<HTMLInputElement | undefined>(undefined)
  useDom("div", {
    children() {
      const input = useDom("input", {
        type: "number",
        onInput(e) {
          const input = e.target as HTMLInputElement
          setValue(Number(input.value))
        }
      })
      useDom("button", {
        onClick() {
          setValue(v => v + 1)
          console.log(input.value)
        },
        children() {
          renderContent("设置值")
        }
      })
    }
  })
}

function simpleButton(v: string) {
  renderContent(v)
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
          renderContent("增加")
        }
      })
      renderContent(`值${count}`)
      useDom("button", {
        onClick() {
          setCount(count - 1)
        },
        children() {
          renderContent("减少")
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
          renderContent("增c加")
        }
      })
      renderContent(`值${count}`)
      useDom("button", {
        onClick() {
          setCount(count - 1)
        },
        children() {
          renderContent("减c少")
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
  renderArray(list, v => v.index, (row, i) => {
    useDom("div", {
      children() {
        useDom("div", {
          children() {
            renderContent(`我是内容${row.index}---${row.key}`)
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
            renderContent("删除")
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
      renderContent("增加列表")
    }
  })
}