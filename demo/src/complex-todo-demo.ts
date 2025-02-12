import { fdom } from "better-react-dom";
import { createUseReducer, renderArray, renderIf, useChange, useEffect, useMemo, useOnlyId } from "better-react-helper";
import { emptyArray } from "wy-helper";
import "todomvc-app-css/index.css";
import "todomvc-common/base.css";
import { renderInputBool } from "better-react-dom-helper";
type State = {
  uid: number
  items: TodoItem[]
}

type TodoItem = {
  id: number
  title: string
  completed: boolean
}

type Action = {
  type: "add"
  title: string
} | {
  type: "update"
  id: number
  title: string
} | {
  type: "remove"
  id: number
} | {
  type: "toggle"
  id: number
} | {
  type: "removeAll"
} | {
  type: "toggleAll"
  completed: boolean
} | {
  type: "removeCompleted"
}
const useTodoReducer = createUseReducer((state: State, action: Action) => {
  switch (action.type) {
    case "add":
      const id = state.uid + 1
      return {
        uid: id,
        items: state.items.concat({
          id,
          title: action.title,
          completed: false
        })
      };
    case "update":
      return {
        ...state,
        items: state.items.map(item => {
          if (item.id == action.id) {
            return {
              ...item,
              title: action.title
            }
          }
          return item
        })
      }
    case "remove":
      return {
        ...state,
        items: state.items.filter(item => item.id != action.id)
      }
    case "toggle":
      return {
        ...state,
        items: state.items.map(item => {
          if (item.id == action.id) {
            return {
              ...item,
              completed: !item.completed
            }
          }
          return item
        })
      }
    case "removeAll":
      return {
        uid: 0,
        items: emptyArray as TodoItem[]
      }
    case "toggleAll":
      return {
        ...state,
        items: state.items.map(item => {
          if (item.completed != action.completed) {
            return {
              ...item,
              completed: action.completed
            }
          }
          return item
        })
      }
    case "removeCompleted":
      return {
        ...state,
        items: state.items.filter(item => !item.completed)
      }
  }
  return state
})
const map = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};
const sanitize = (string: string) => {
  const reg = /[&<>"'/]/gi;
  return string.replace(reg, (match) => map[match as '<']);
};
const initState: State = {
  uid: 0,
  items: emptyArray as any[]
}

type Route = "active" | "completed"
export default function () {
  const [data, dispatch] = useTodoReducer(initState)
  const [route, setRoute] = useChange<Route>()
  fdom.style({
    childrenType: "html",
    children: `
    .visually-hidden {
    border: 0;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    width: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
}

.toggle-all {
    width: 40px !important;
    height: 60px !important;
    right: auto !important;
}

.toggle-all-label {
    pointer-events: none;
}
    `
  })
  fdom.div({
    children() {
      fdom.section({
        className: "todoapp",
        children() {
          fdom.header({
            className: "header",
            children() {
              fdom.h1({
                s_lineHeight: "1.4em",
                childrenType: "text",
                children: "todos"
              })
              renderInput({
                label: "New todo Input",
                defaultValue: '',
                onSubmit(title) {
                  dispatch({
                    type: "add",
                    title
                  })
                },
              })
            }
          })
          const visibleTodos = useMemo(
            () =>
              data.items.filter((todo) => {
                if (route === "active")
                  return !todo.completed;

                if (route === "completed")
                  return todo.completed;

                return todo;
              }),
            [data.items, route]
          );
          fdom.main({
            className: "main",
            children() {
              renderIf(visibleTodos.length, () => {
                fdom.div({
                  className: "toggle-all-container",
                  children() {
                    const checked = visibleTodos.every(todo => todo.completed)
                    renderInputBool({
                      type: "checkbox",
                      className: "toggle-all",
                      id: "toggle-all",
                      checked: checked,
                      onInput(e) {
                        dispatch({
                          type: "toggleAll",
                          completed: !checked
                        })
                      }
                    })
                    fdom.label({
                      className: "toggle-all-label",
                      a_htmlFor: "toggle-all",
                      childrenType: "text",
                      children: "Toggle All Input"
                    })
                  }
                })
              })
              fdom.ul({
                className: "todo-list",
                children() {
                  renderArray(visibleTodos, v => v.id, (todo, i) => {
                    const [isWritable, setIsWritable] = useChange(false)
                    fdom.li({
                      className: todo.completed ? 'completed' : '',
                      children() {
                        fdom.div({
                          className: "view",
                          children() {
                            renderIf(isWritable, () => {
                              renderInput({
                                defaultValue: todo.title,
                                onSubmit(title) {
                                  if (title.length) {
                                    dispatch({
                                      type: "update",
                                      id: todo.id,
                                      title
                                    })
                                  } else {
                                    dispatch({
                                      type: "remove",
                                      id: todo.id,
                                    })
                                  }
                                  setIsWritable(false)
                                },
                                label: "Edit Todo Input",
                                onBlur() {
                                  setIsWritable(false)
                                },
                              })
                            }, () => {
                              renderInputBool({
                                type: "checkbox",
                                className: "toggle",
                                checked: todo.completed,
                                onInput(e) {
                                  dispatch({
                                    type: "toggle",
                                    id: todo.id
                                  })
                                }
                              })

                              fdom.label({
                                childrenType: "text",
                                children: todo.title,
                                onDoubleClick() {
                                  setIsWritable(true)
                                }
                              })

                              fdom.button({
                                className: "destroy",
                                onClick() {
                                  dispatch({
                                    type: "remove",
                                    id: todo.id
                                  })
                                }
                              })
                            })
                          }
                        })
                      }
                    })
                  })
                }
              })
            }
          })
          const activeTodos = useMemo(() => data.items.filter((todo) => !todo.completed), [data.items]);

          fdom.footer({
            className: "footer box-content",
            children() {
              fdom.span({
                className: "todo-count",
                childrenType: "text",
                children: `${activeTodos.length} ${activeTodos.length === 1 ? "item" : "items"} left!`
              })
              fdom.ul({
                className: "filters",
                children() {
                  fdom.li({
                    children() {
                      fdom.a({
                        className: route ? '' : 'selected',
                        onClick() {
                          setRoute(undefined)
                        },
                        childrenType: "text",
                        children: "All"
                      })
                    }
                  })

                  fdom.li({
                    children() {
                      fdom.a({
                        className: route == 'active' ? 'selected' : '',
                        onClick() {
                          setRoute('active')
                        },
                        childrenType: "text",
                        children: "Active"
                      })
                    }
                  })

                  fdom.li({
                    children() {
                      fdom.a({
                        className: route == 'completed' ? 'selected' : '',
                        onClick() {
                          setRoute('completed')
                        },
                        childrenType: "text",
                        children: "Completed"
                      })
                    }
                  })
                }
              })

              fdom.button({
                className: "clear-completed",
                childrenType: "text",
                children: "Clear completed",
                a_disabled: activeTodos.length == data.items.length,
                onClick() {
                  dispatch({ type: "removeCompleted" })
                }
              })
            }
          })
        }
      })
    }
  })
}

function renderInput({
  defaultValue,
  label,
  onSubmit,
  onBlur
}: {
  defaultValue: string
  label: string
  onBlur?(): void
  onSubmit(title: string): void
}) {

  fdom.div({
    className: "input-container",
    children() {
      const input = fdom.input({
        a_id: "todo-input",
        className: "new-todo",
        a_autoFocus: true,
        a_placeholder: "What needs to be done?",
        onBlur,
        onKeyDown(e) {
          if (e.key == "Enter") {
            const value = input.value.trim()
            if (value.length < 2) {
              return
            }
            const title = sanitize(value)
            onSubmit(title)
            input.value = ""
          }
        }
      })
      useEffect(() => {
        input.value = defaultValue
        input.focus()
      }, emptyArray)
      fdom.label({
        className: "visually-hidden",
        childrenType: "text",
        children: label,
        a_htmlFor: "todo-input"
      })
    }
  })
}