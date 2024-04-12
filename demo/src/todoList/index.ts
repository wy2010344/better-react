import { dom } from "better-react-dom";
import { initJsStore } from "../jsStore";
import { normalPanel } from "../panel/PanelContext";
import { renderInput } from "better-react-dom-helper";
import { useChange, useVersion, useInit, renderIf, useState, useCallbackPromiseCall, arrayHasValue } from "better-react-helper";
import { TodoModel, todoService } from "../jsStore/todo";
import { renderMapF } from "better-react";
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

          useCallbackPromiseCall(
            (data) => {
              setData({
                ...data,
                version
              })
            },
            () => {
              return todoService.getAll()
            },
            [version])

          renderInput("input", {
            value,
            onValueChange(v) {
              setValue(v)
            },
          })
          dom.button({
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
          dom.button({
            textContent: "调整顺序",
            onClick(e) {
              e.preventDefault()
              moveFromTo()
            }
          })
        },
      })
      console.log('guard-render')
      renderGuard(data,
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
            renderMapF(undefined, vs, 0 as number, arrayHasValue, function (data, i) {
              console.log("map-render")
              const row = data[i]
              return [i + 1, row.id, undefined, function () {
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

                    dom.button({
                      textContent: `数x字${ct}`,
                      onClick(e) {
                        e.stopPropagation()
                        setCt(v => v + 1)
                      },
                    })

                    Counter()

                    dom.button({
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


      renderIf(data?.version != version, function () {
        useDom('div', {
          textContent: '正在加载'
        })
      })
    },
  })
})