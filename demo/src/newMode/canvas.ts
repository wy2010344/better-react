import { FiberConfig, MemoEvent, RenderWithDep, hookAddResult, renderFiber } from "better-react";
import { EmptyFun, Point, emptyArray, emptyObject, run } from "wy-helper";
import { useAttrEffect, useMemo } from "better-react-helper";



function createCanvasConfig(e: MemoEvent<HTMLCanvasElement>) {
  return {
    allowAdd(v) {
      return v && v.type
    },
    useAfterRender(vs) {
      useAttrEffect(() => {
        const c = e.trigger
        const ctx = c.getContext("2d")
        const hasEvent: {
          [key in CanvasEvent]?: boolean
        } = {}
        if (ctx) {
          ctx.reset()
          ctx.clearRect(0, 0, c.width, c.height)
          for (const v of vs) {
            if (v.type == "draw") {
              if (v.sub == 'call') {
                (ctx as any)[v.method](...v.args)
              } else if (v.sub == 'assign') {
                (ctx as any)[v.name] = v.value
              }
            } else if (v.type == "event") {
              canvasEvents.forEach(c => {
                if (v.events[c]) {
                  hasEvent[c] = true
                }
              })
            }
          }
        }
        const destroys: EmptyFun[] = []
        canvasEvents.forEach(s => {
          if (hasEvent[s]) {
            const fun = (e: PointerEvent) => {
              const canvas = {
                x: e.clientX,
                y: e.clientY
              }
              for (let i = vs.length - 1; i > -1; i--) {
                const v = vs[i]
                if (v.type == "event") {
                  if (v.x < canvas.x && v.y < canvas.y
                    && v.x + v.width > canvas.x && v.y + v.height > canvas.y) {
                    const event = v.events[s]
                    if (event) {
                      event({
                        canvas,
                        client: {
                          x: canvas.x - v.x,
                          y: canvas.y - v.y
                        }
                      })
                    }
                    return
                  }
                }
              }
            }
            c.addEventListener(s, fun)
            destroys.push(fun)
          }
        })
        return function () {
          destroys.forEach(run)
        }
      })
      return emptyArray
    },
  } as FiberConfig
}

export function renderCanvas<T>(
  canvas: HTMLCanvasElement,
  ...args: RenderWithDep<T>
) {
  const canvasConfig = useMemo(createCanvasConfig, canvas)
  renderFiber(canvasConfig, ...args)
}

const canvasEvents = ["pointerdown", "pointermove", "pointerup"] as const
type CanvasEvent = typeof canvasEvents[number]
export function hookEvent(
  x: number, y: number, width: number, height: number,
  events: {
    [key in CanvasEvent]?: (e: {
      client: Point
      canvas: Point
    }) => void
  }) {
  hookAddResult({
    type: "event",
    x, y, width, height,
    events,
  })
}



export const hookDraw: CanvasRenderingContext2D = new Proxy(emptyObject as any, {
  get(target, p, receiver) {
    return function (...args: any[]) {
      hookAddResult({
        type: "draw",
        sub: "call",
        method: p,
        args
      })
    }
  },
  set(target, p, newValue, receiver) {
    hookAddResult({
      type: "draw",
      sub: "assign",
      name: p,
      value: newValue
    })
    return true
  },
})