import { Fiber, MemoEvent, RenderWithDep, StoreValue, hookAddResult, hookCreateChangeAtom, renderFiber } from "better-react";
import { EmptyFun, Point, emptyArray, emptyObject, run, arrayPushAll, alawaysFalse } from "wy-helper";
import { useAttrEffect, useMemo } from "better-react-helper";



function drawCanvas(c: HTMLCanvasElement, drawList: any[]) {
  const ctx = c.getContext("2d")
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
  return ctx!
}

function drawSubCanvas(ctx: CanvasRenderingContext2D, subFibers: SubFiber[]) {
  for (const subFiber of subFibers) {
    const value = subFiber.fiber.lazyGetResultValue()
    ctx.drawImage(value.canvas, subFiber.x, subFiber.y, value.canvas.width, value.canvas.height)
  }
}
class CanvasStoreValue implements StoreValue {
  constructor(
    private canvas: HTMLCanvasElement
  ) { }

  private drawList: any[] = []
  private eventList: any[] = []
  private subFibers: SubFiber[] = []

  hookAddResult(type: "draw" | "event", args: any): void {
    if (type == 'draw') {
      this.drawList.push(args)
    } else if (type == "event") {
      this.eventList.push(args)
    } else if (type == 'fiber') {
      this.subFibers.push(args)
    } else {
      console.log("不知道什么类型,无法处理", type, args)
    }
  }


  //这几个参数都要做成可回滚的,虽然都不是持久的,但可能
  readonly childrenDirty = hookCreateChangeAtom()(false, alawaysFalse)
  private finallyEvents: any[] = emptyArray as any
  useAfterRender() {
    this.childrenDirty.set(true)
    const that = this
    useAttrEffect(() => {
      //在attr里面绘制,因为设置尺寸可能导致绘制结果丢失
      const c = that.canvas
      const destroys: EmptyFun[] = []
      canvasEvents.forEach(s => {
        const fun = (e: PointerEvent) => {
          if (!e) {
            return
          }
          const canvas = {
            x: e.clientX,
            y: e.clientY
          }
          for (let i = that.finallyEvents.length - 1; i > -1; i--) {
            const v = that.finallyEvents[i]

            if (v.x < canvas.x && v.y < canvas.y
              && v.x + v.width > canvas.x && v.y + v.height > canvas.y) {
              const event = v.events[s]
              let ct = false
              if (event) {
                ct = event({
                  canvas,
                  client: {
                    x: canvas.x - v.x,
                    y: canvas.y - v.y
                  }
                })
              }
              if (!ct) {
                return
              }
            }
          }
        }
        c.addEventListener(s, fun)
        destroys.push(fun)
      }, emptyArray)
      return function () {
        destroys.forEach(run)
      }
    }, emptyArray)
    return emptyArray
  }

  onRenderLeave(addLevelEffect: (level: number, set: EmptyFun) => void, parentResult: any): void {
    if (this.childrenDirty.get()) {
      const that = this
      addLevelEffect(1, function () {
        const drawList = that.drawList
        const ctx = drawCanvas(that.canvas, drawList)
        drawSubCanvas(ctx, that.subFibers)



        const eventList = [...that.eventList]
        function addAllEvent(subFibers: SubFiber[]) {
          for (const subFiber of subFibers) {
            const value = subFiber.fiber.lazyGetResultValue()
            arrayPushAll(eventList, value.eventList)
            addAllEvent(value.subFibers)
          }
        }
        addAllEvent(that.subFibers)
        that.finallyEvents = eventList
      })
    }
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




type SubFiber = {
  x: number
  y: number
  fiber: Fiber<SubCanvas>
}
type SubCanvas = {
  canvas: HTMLCanvasElement
  eventList: any[]
  subFibers: SubFiber[]
}


class SubCanvasStoreValue implements StoreValue {
  constructor(
    private readonly canvas: HTMLCanvasElement
  ) { }
  private drawList: any[] = []
  private eventList: any[] = []
  private subFibers: any[] = []
  private size: { width: number, height: number } = null as any
  hookAddResult(type: "draw" | "event" | "fiber" | "size", args: any): void {
    if (type == 'draw') {
      this.drawList.push(args)
    } else if (type == "event") {
      this.eventList.push(args)
    } else if (type == 'fiber') {
      this.subFibers.push(args)
    } else if (type == "size") {
      this.size = args;
    } else {
      console.log("不知道什么类型,无法处理", type, args)
    }
  }
  //这几个参数都要做成可回滚的,虽然都不是持久的.
  readonly childrenDirty = hookCreateChangeAtom()(false, alawaysFalse)
  useAfterRender() {
    this.childrenDirty.set(true)
    return {
      canvas: this.canvas,
      eventList: this.eventList,
      subFibers: this.subFibers
    }
  }

  onRenderLeave(addLevelEffect: (level: number, set: EmptyFun) => void, parentResult: any): void {
    if (this.childrenDirty.get()) {
      parentResult.childrenDirty.set(true)
      const that = this
      addLevelEffect(1, function () {
        //自身必须重新绘制,因为叠加层可能是透明的.只有某些子节点可以缓存
        const c = that.canvas
        c.width = that.size.width
        c.height = that.size.height
        const drawList = that.drawList
        const ctx = drawCanvas(c, drawList)
        drawSubCanvas(ctx, that.subFibers)
      })
    }
  }
}

function createSubCanvasConfig() {
  const canvas = document.createElement("canvas")
  return function () {
    return new SubCanvasStoreValue(canvas)
  }
}
export function renderSubCanvas<T>(
  x: number,
  y: number,
  width: number,
  height: number,
  ...[a, b, c]: RenderWithDep<T>) {
  const canvasConfig = useMemo(createSubCanvasConfig)
  const fiber = renderFiber(canvasConfig, a, function (e) {
    hookAddResult("size", { width, height })
    b(e)
  }, c)
  hookAddResult("fiber", {
    x,
    y,
    fiber
  })
}