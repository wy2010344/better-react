import mb from './mb'


type MEvent = {
  clientX: number
  clientY: number
  target: any
}

function diff(isX: boolean, e: MEvent, old_e: MEvent) {
  if (isX) {
    return e.clientX - old_e.clientX;
  } else {
    return e.clientY - old_e.clientY;
  }
}

export function dragMoveUtil(p: {
  border?: Node
  down?(e: MEvent): void
  move(e: MEvent): void
  up?(e: MEvent): void
  leave?(e: MEvent): void
}) {
  let isMove = false
  function move(e: MEvent) {
    if (isMove) {
      p.move(e)
    }
  }
  function up(e: MEvent) {
    canSelect()
    if (p.up) {
      e = (e || window.event) as MEvent
      p.up(e)
    }
    destroy()
  }
  function leave(e: MEvent) {
    canSelect()
    if (p.leave) {
      e = (e || window.event) as MEvent
      p.leave(e)
    }
    destroy()
  }
  let div = p.border
  function init() {
    isMove = true
    mb.DOM.addEvent(div, "mousemove", move);
    mb.DOM.addEvent(div, "mouseup", up);
    mb.DOM.addEvent(div, "mouseleave", leave);
  }
  function destroy() {
    isMove = false
    mb.DOM.removeEvent(div, "mousemove", move);
    mb.DOM.removeEvent(div, "mouseup", up);
    mb.DOM.removeEvent(div, "mouseleave", leave);
  }
  return function (e: MEvent) {
    stopSelect()
    e = (e || window.event) as MEvent
    if (!div) {
      div = e.target as Node
    }
    if (p.down) {
      p.down(e)
    }
    init()
  }
}
export interface DragMoveHelperParam {
  border?: Node
  init?(e: MEvent): void
  allow?(): boolean
  diff?(v: { x: number, y: number, e: MEvent }): void
  diffX?(x: number): void
  diffY?(y: number): void
  cancel?(e: MEvent): void
}
/**
 * 只移动
 * @param p 
 */
export function dragMoveHelper(p: DragMoveHelperParam) {
  let laste: MEvent
  const allow = p.allow || function () { return true };
  const diffPool: ((x: number, y: number, e: MEvent) => void)[] = []
  if (p.diff) {
    const diff = p.diff
    diffPool.push(function (x, y, e) {
      diff({ x, y, e })
    })
  }
  if (p.diffX) {
    const diffX = p.diffX
    diffPool.push(function (x, y) {
      if (x != 0) {
        diffX(x)
      }
    })
  }
  if (p.diffY) {
    const diffY = p.diffY
    diffPool.push(function (x, y) {
      if (y != 0) {
        diffY(y)
      }
    })
  }
  function cancel(e: MEvent) {
    e = (e || window.event) as MEvent
    if (p.cancel) {
      p.cancel(e)
    }
    mb.DOM.preventDefault(e)
    mb.DOM.stopPropagation(e)
  }
  return dragMoveUtil({
    border: p.border || document,
    down(e) {
      e = (e || window.event) as MEvent
      laste = e
      if (p.init) {
        p.init(e)
      }
      mb.DOM.preventDefault(e)
      mb.DOM.stopPropagation(e)
    },
    move(e) {
      if (allow()) {
        e = (e || window.event) as MEvent
        const x = e.clientX - laste.clientX
        const y = e.clientY - laste.clientY
        for (let diff of diffPool) {
          diff(x, y, e)
        }
        laste = e
        mb.DOM.preventDefault(e)
        mb.DOM.stopPropagation(e)
      }
    },
    up: cancel,
    leave: cancel
  })
}


export interface Direction {
  l?: boolean,
  r?: boolean,
  t?: boolean,
  b?: boolean
}
type TEvent = {
  event: {

  },
  dir: Direction
}

/**
 * 主要是拖拽放大。拖动只是辅助。如果只有拖动，不如另写
 * @param p 
 */
export function dragResizeHelper(p: {
  border?: Node;
  addLeft(x: number): void
  addTop(x: number): void,
  addWidth(x: number): void,
  addHeight(x: number): void
}) {
  let event: TEvent | null = null
  const m = {
    cancel() {
      event = null;
      canSelect();
      destroy()
    },
    move(e: MEvent) {
      if (!event) {
        return
      }
      const old_e = event.event as MEvent;
      e = e || window.event;
      event.event = e;
      const x = diff(true, e, old_e);
      const y = diff(false, e, old_e);
      if (x != 0) {
        if (event.dir.l) {
          p.addLeft(x)
          p.addWidth(-x)
        }
        if (event.dir.r) {
          p.addWidth(x)
        }
      }
      if (y != 0) {
        if (event.dir.t) {
          p.addTop(y)
          p.addHeight(-y)
        }
        if (event.dir.b) {
          p.addHeight(y)
        }
      }
    }
  };
  //最大边界，一般是document
  const border = p.border || document;

  function init() {
    mb.DOM.addEvent(border, "mousemove", m.move);
    mb.DOM.addEvent(border, "mouseup", m.cancel);
    mb.DOM.addEvent(border, "mouseleave", m.cancel);
  }
  function destroy() {
    mb.DOM.removeEvent(border, "mousemove", m.move);
    mb.DOM.removeEvent(border, "mouseup", m.cancel);
    mb.DOM.removeEvent(border, "mouseleave", m.cancel);
  }
  return function (e: MEvent, dir: Direction) {
    stopSelect();
    event = {
      event: e,
      dir: dir
    }
    init()
  }
}

function stopSelect() {
  const style = document.body.style as any
  style.webkitUserSelect = 'none';
  style["msUserSelect"] = 'none';
  style["mozUserSelect"] = 'none';
  style["user-select"] = "none";
}
function canSelect() {
  const style = document.body.style as any
  style.webkitUserSelect = '';
  style["msUserSelect"] = '';
  style["mozUserSelect"] = '';
  style["user-select"] = "";
}