import { useDom } from "better-react-dom";
import { initJsStore } from "../jsStore";
import { normalPanel } from "../panel/PanelContext";
import { useInput } from "better-react-dom-helper";
import { useChange, usePromise, useVersion, PromiseResult, useInit, useGuard, useIf, useMap, defaultTranslate, useState } from "better-react-helper";
import { TodoModel, todoService } from "../jsStore/todo";
import { useEffect, useMapF } from "better-react";
import Counter from "../test/Counter";

initJsStore()
export default normalPanel(function (operate, id) {

  console.log('top-render')
  useDom("div", {
    children() {

      const [version, updateVersion] = useVersion()
      const [data, setData] = useChange<PromiseResult<TodoModel[]> & {
        version: number
      }>()

      function moveFromTo(fromIdx?: number, toIdx?: number) {

        if (data?.type == 'success') {
          const size = data.value.length

          if (typeof (fromIdx) != 'number') {
            fromIdx = Math.floor(Math.random() * size)
          }
          if (typeof (toIdx) != 'number') {
            toIdx = Math.floor(Math.random() * size)
          }
          if (fromIdx != toIdx) {
            console.log(`移动 ${fromIdx} ---> ${toIdx}`)
            const newData = data.value.slice()
            const [old] = newData.splice(fromIdx, 1)
            newData.splice(toIdx, 0, old)
            setData({
              ...data,
              value: newData
            })
          }
        }
      }
      useInit(() => updateVersion())
      useDom("div", {
        children() {
          const [value, setValue] = useChange('');
          usePromise({
            body() {
              return todoService.getAll()
            },
            onFinally(data) {
              setData({
                ...data,
                version
              } as any)
            },
          }, [version])

          useInput("input", {
            value,
            onValueChange(v) {
              setValue(v)
            },
          })
          useDom("button", {
            textContent: "增加",
            onClick(e) {
              e.preventDefault()
              const v = value.trim()
              if (v) {
                todoService.add(v)
                setValue('')
                updateVersion()
              } else {
                alert("请输入内容")
              }
            },
          })
          useDom("button", {
            textContent: "调整顺序",
            onClick(e) {
              e.preventDefault()
              moveFromTo()
            }
          })
        },
      })
      console.log('guard-render')
      useGuard(data,
        [
          v => !v,
          () => {
            useDom("div", {
              textContent: "请加载数据"
            })
          }
        ],
        [
          v => v?.type == 'success',
          (v) => {
            console.log("外部render")
            const vs = v?.value! as TodoModel[]
            useMapF(undefined, vs, defaultTranslate, function (row, i) {
              console.log("map-render")
              return [row.id, undefined, function () {
                console.log("row-render", row.id)

                const [ct, setCt] = useState(0);
                useDom("div", {
                  style: `
                display:flex;
                `,
                  children() {
                    console.log("cctt-render")
                    useDom("div", {
                      textContent: `${row.id} : ${row.content}`
                    })

                    useDom("input", {
                      type: "checkbox",
                      async onChange(e) {
                        const finished = e.target.checked
                        if (finished != row.finished) {
                          await todoService.update(row, {
                            finished
                          })
                          updateVersion()
                        }
                      },
                    })

                    useDom("button", {
                      textContent: `数x字${ct}`,
                      onClick(e) {
                        e.stopPropagation()
                        setCt(v => v + 1)
                      },
                    })

                    Counter()

                    useDom("button", {
                      textContent: `${i + 1}移动到随机`,
                      onClick(e) {
                        setCt(v => v + 1)
                        moveFromTo(i)
                        e.stopPropagation()
                      },
                    })
                  }
                })
              }, [row]]
            }, [vs])
          }
        ],
        [
          v => v?.type == 'error',
          (v) => {
            useDom('div', {
              textContent: `出现错误${v?.value}`
            })
          }
        ]
      )


      useIf(data?.version != version, function () {
        useDom('div', {
          textContent: '正在加载'
        })
      })
    },
  })
})