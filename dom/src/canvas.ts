import { MemoEvent, RenderWithDep, StoreValue, hookAddResult, renderFiber } from "better-react";
import { EmptyFun, Point, emptyArray, emptyObject, run } from "wy-helper";
import { useAttrEffect, useMemo } from "better-react-helper";



class CanvasStoreValue implements StoreValue {
  constructor(
    private canvas: HTMLCanvasElement
  ) { }

  private drawList: any[] = []
  private eventList: any[] = []

  hookAddResult(type: "draw" | "event", args: any): void {
    if (type == 'draw') {
      this.drawList.push(args)
    } else if (type == "event") {
      this.eventList.push(args)
    } else {
      console.log("不知道什么类型,无法处理", type, args)
    }
  }
  useAfterRender() {
    const that = this
    useAttrEffect(() => {
      const c = that.canvas
      const drawList = that.drawList
      const eventList = that.eventList
      const ctx = c.getContext("2d")
      const hasEvent: {
        [key in CanvasEvent]?: boolean
      } = {}
      if (ctx) {
        ctx.reset()
        ctx.clearRect(0, 0, c.width, c.height)
        for (const v of drawList) {
          if (v.sub == 'call') {
            (ctx as any)[v.method](...v.args)
          } else if (v.sub == 'assign') {
            (ctx as any)[v.name] = v.value
          }
        }
      }
      for (const event of eventList) {
        canvasEvents.forEach(c => {
          if (event.events[c]) {
            hasEvent[c] = true
          }
        })
      }
      const destroys: EmptyFun[] = []
      canvasEvents.forEach(s => {
        if (hasEvent[s]) {
          const fun = (e: PointerEvent) => {
            const canvas = {
              x: e.clientX,
              y: e.clientY
            }
            for (let i = eventList.length - 1; i > -1; i--) {
              const v = eventList[i]
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
          c.addEventListener(s, fun)
          destroys.push(fun)
        }
      })
      return function () {
        destroys.forEach(run)
      }
    })
    return emptyArray
  }
}

function createCanvasConfig(e: MemoEvent<HTMLCanvasElement>) {
  return function () {
    return new CanvasStoreValue(e.trigger)
  }
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
  hookAddResult("event", {
    x, y, width, height,
    events,
  })
}



export const hookDraw: CanvasRenderingContext2D = new Proxy(emptyObject as any, {
  get(target, p, receiver) {
    return function (...args: any[]) {
      hookAddResult("draw", {
        type: "draw",
        sub: "call",
        method: p,
        args
      })
    }
  },
  set(target, p, newValue, receiver) {
    hookAddResult("draw", {
      sub: "assign",
      name: p,
      value: newValue
    })
    return true
  },
})