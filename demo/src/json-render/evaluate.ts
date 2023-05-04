import { useDom, useContent } from "better-react-dom"


export type Context = {
  [key: string]: Define
}
type Define = Component
type Component = {
  type: "component"
  body: []
}
export type CallExp = {
  type: "call"
  fun: string
  args?: {
    [key: string]: any
  }
}
export function evaluate(
  ext: CallExp,
  context?: Context
) {
  const define = libraryDefines[ext.fun]
  if (define) {
    //系统定义
    define.run(ext.args, context)
  } else {
    //自定义
  }
}

const libraryDefines: {
  [key: string]: any
} = {
  View: {
    run(args: any) {
      useDom("div",)
    }
  },
  Button: {
    run(args: any, context: Context) {
      useDom("button", {
        onClick: args.onClick ? buildEvent(args.onClick) : undefined,
        children() {
          for (const child of args.children) {
            if (child.type == "call") {
              evaluate(child, context)
            }
          }
        },
      })
    }
  },
  Text: {
    run(args: any) {
      useContent(args.content)
    }
  }
}

function buildEvent(exp: {
  type: "event"
  body: any[]
}) {
  return function () {
    for (const child of exp.body) {

    }
  }
}