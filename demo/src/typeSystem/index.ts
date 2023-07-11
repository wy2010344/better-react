import { useDom } from "better-react-dom";
import { useBuildSubSetArray, useBuildSubSetObject, useState, renderMap } from "better-react-helper";
import { normalPanel } from "../panel/PanelContext";
import { alertWith, use居中 } from "../panel/居中";
import { useClickOutside, useInput } from "better-react-dom-helper";
import { AllType, SubStructTypeModel, useTypeDB } from "./model";



export default normalPanel(function (operate, id) {

  const { list, checkExist, add, update } = useTypeDB()
  useDom("div", {
    children() {
      useDom("button", {
        textContent: "增加结构体",
        onClick(e) {
          e.stopPropagation()
          const name = prompt("请输入结构体名称")
          if (name) {
            if (checkExist("type", name)) {
              return alert("存在相同名称")
            }
            add({
              metaType: "type",
              name,
              value: {
                type: "struct",
                fields: {}
              }
            })
          }
        },
      })
      useDom("button", {
        textContent: "增加实例"
      })
    },
  })
  renderMap(list, v => v.metaType + "-" + v.name, type => {
    useDom("div", {
      css: `
          >*{
            display:table-cell;
          }
          >.edit-column{
            >.edit{
              display:none;
            }
          }
          >.type-column{
            display:none;
          }
          &:hover{
            >.type-column{
              display:unset;
            }
            >.edit-column{
              >.edit{
                display:unset;
              }
            }
          }
          `,
      style: {
        display: "table-row"
      },
      children() {
        useDom("div", {
          style: {
            color: type.metaType == 'type' ? "green" : "blue"
          },
          textContent: type.name
        })
        useDom("div", {
          className: "edit-column",
          children() {
            useDom("button", {
              className: "edit",
              textContent: "修改",
              onClick(e) {
                e.stopPropagation()
                if (type.metaType == 'type') {
                  if (type.value.type == 'struct') {
                    structAlert(operate, {
                      value: type.value,
                      setValue(v) {
                        update(type, {
                          value: v
                        })
                      },
                    })
                  }
                }
              },
            })
          }
        })
        useDom("div", {
          className: "type-column",
          textContent: type.metaType == "type" ? type.value.type : ""
        })
      }
    })
  })
})

type StructKVPair = {
  id: number
  key?: string
  value: string[]
}
let uid = 0
function createPair(key?: string, value?: string[]) {
  return {
    id: uid++,
    key,
    value: value || []
  }
}
const structAlert = alertWith<{
  value: SubStructTypeModel
  setValue(v: SubStructTypeModel): void
}>(function (operate, id, value) {
  const [list, setList] = useState<StructKVPair[]>(() => {
    return Object.entries(value.value.fields).map(([key, value]) => {
      return createPair(key, value)
    })
  })
  useDom("div", {
    style: {
      display: "inline-block"
    },
    children() {
      renderMap(list, v => v.id, function (row, i) {
        const setRow = useBuildSubSetArray(setList, v => v.id == row.id)
        const setKey = useBuildSubSetObject(setRow, 'key')
        const setValue = useBuildSubSetObject(setRow, 'value')
        useDom("div", {
          style: {
            display: "table-row"
          },
          children() {
            useDom("div", {
              style: {
                display: "table-cell"
              },
              children() {
                useInput("input", {
                  value: row.key || '',
                  onValueChange(v) {
                    setKey(v)
                  },
                })
              },
            })
            useDom("div", {
              style: {
                display: "table-cell"
              },
              children() {
                useDom("div", {
                  style: {
                    position: "relative"
                  },
                  children() {
                    const [show, setShow] = useState(false)
                    useClickOutside(e => {
                      return button.contains(e) || panel.contains(e)
                    }, () => {
                      setShow(false)
                    })


                    const [filterValue, setFilterValue] = useState('')
                    const button = useDom("div", {
                      children() {
                        renderMap(row.value, v => v, function (row) {
                          useDom("button", {
                            textContent: row,
                            onClick() {
                              setValue(list => list.filter(v => v != row))
                            }
                          })
                        })
                        useInput("input", {
                          value: filterValue,
                          onFocus() {
                            setShow(true)
                          },
                          onValueChange(v) {
                            setFilterValue(v)
                          },
                        })
                      },
                    })
                    const panel = useDom("div", {
                      style: {
                        display: show ? "" : "none",
                        position: "absolute",
                        backgroundColor: "white",
                        zIndex: 1
                      },
                      children() {
                        const { list } = useTypeDB()
                        renderMap(list.filter(v => {
                          return v.metaType == 'type' && !row.value.includes(v.name) && v.name.includes(filterValue)
                        }), v => v.name, function (type) {
                          useDom("button", {
                            textContent: type.name,
                            onClick(event) {
                              setValue(list => list.concat(type.name))
                              setShow(false)
                              setFilterValue('')
                            },
                          })
                        })
                      },
                    })
                  },
                })
              },
            })
            useDom("div", {
              style: {
                display: "table-cell"
              },
              children() {
                useDom("button", {
                  textContent: "删除",
                  onClick(event) {
                    setRow()
                  },
                })
              },
            })
          },
        })
      })
      useDom("div", {
        style: {
          display: "table-row"
        },
        children() {
          useDom("div", {
            style: {
              display: "table-cell"
            },
            children() {
              useDom("button", {
                textContent: "取消",
                onClick(event) {
                  operate.close(id)
                },
              })
            },
          })
          useDom("div", {
            style: {
              display: "table-cell"
            },
            children() {
              useDom("button", {
                textContent: "确定",
                onClick(event) {
                  const map: {
                    [key in string]: string[]
                  } = {}
                  for (const row of list) {
                    if (row.key && row.value.length > 0) {
                      map[row.key] = row.value
                    }
                  }
                  value.setValue({
                    ...value.value,
                    fields: map
                  })
                  operate.close(id)
                },
              })
            },
          })
          useDom("div", {
            style: {
              display: "table-cell"
            },
            children() {
              useDom("button", {
                textContent: "添加",
                onClick(event) {
                  setList(list => list.concat(createPair()))
                },
              })
            },
          })
        },
      })
    },
  })
})