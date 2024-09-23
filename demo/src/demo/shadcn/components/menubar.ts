import { cn, tw } from "@/utils";
import { dom } from "better-react-dom";
import { renderIf, useCallback, useChange, useConst, useEffect, useRef } from "better-react-helper";
import { emptyArray, EmptyFun } from "wy-helper";
import { renderPortalPop } from "./portal";
import { renderChevronRightIcon } from "./icons";
import { createContext, renderStateHolder } from "better-react";

export const menubar = tw`flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm`

export const menuBarContext = createContext<{
  current: EmptyFun | undefined
}>(undefined as any)


export function useMenubar() {
  const closeChoose = useRef<EmptyFun | undefined>(undefined)
  menuBarContext.useProvider(closeChoose)
}

export type DIR = "left" | "right" | "bottom" | "top"
export function renderMenubar(config:
  {
    renderTrigger: (props: {
      className: string,
      onClick: EmptyFun
      onMouseEnter: EmptyFun
    }) => HTMLButtonElement,
    renderContent: (props: {
      className: string
    }) => void
  }
) {
  const closeChoose = menuBarContext.useConsumer()
  const [open, setOpen] = useChange(false)
  const closeOpen = useCallback(() => {
    setOpen(false)
  }, emptyArray)
  renderMenuCtx(sub => {
    useEffect(() => {
      function mouseLeave(e: MouseEvent) {
        const n = e.target as Node
        if (!subAndTriggerContain(trigger, sub, n)) {
          setOpen(false)
        }
      }
      document.addEventListener("click", mouseLeave)
      return () => {
        document.removeEventListener("click", mouseLeave)
      }
    }, emptyArray)
    const trigger = config.renderTrigger({
      className: cn(`flex cursor-default select-none 
items-center rounded-sm 
px-3 py-1 text-sm font-medium outline-none 
hover:bg-accent hover:text-accent-foreground `,
        open ? 'bg-accent text-accent-foreground' : ''
      ),
      onMouseEnter() {
        if (closeChoose?.current && closeChoose.current != closeOpen) {
          closeChoose.current()
          setOpen(true)
          closeChoose.current = closeOpen
        }
      },
      onClick() {
        const onp = !open
        setOpen(onp)
        if (onp && closeChoose) {
          closeChoose.current = closeOpen
        }
      }
    })

    let dir = 'bottom' as DIR

    let dircls = ''
    if (dir == 'left') {
      dircls = tw`slide-in-from-right-2 `
    } else if (dir == 'right') {
      dircls = tw`slide-in-from-left-2 `
    } else if (dir == 'top') {
      dircls = tw`slide-in-from-bottom-2 `
    } else if (dir == 'bottom') {
      dircls = tw`slide-in-from-top-2 `
    }
    return renderPortalPop(trigger, open, {
      exitDelay: 150,
      direction: "y",
      align: "start",
      alignOffset: -4,
      sideOffset: 8
    }, () => {
      config.renderContent({
        className: cn(
          `z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1
text-popover-foreground shadow-md`,
          dircls,
          open ? 'animate-in fade-in-0 zoom-in-95' : 'animate-out fade-out-0 zoom-out-95'
        )
      })
    })
  })
}


type SubPanel = {
  //面板
  container: HTMLElement
  child?: {
    current?: SubPanel
  }
}
export const MenuSubContext = createContext<{
  current: SubPanel
}>(undefined as any)
function createSub() {
  return {
    current: {} as SubPanel
  }
}
function renderMenuCtx(render: (sub: SubPanel) => HTMLElement) {
  const parentRef = MenuSubContext.useConsumer()
  const selfRef = useConst(createSub)
  if (parentRef) {
    parentRef.current.child = selfRef
  }
  useEffect(() => {
    return () => {
      if (parentRef) {
        parentRef.current.child = undefined
      }
    }
  }, emptyArray)
  renderStateHolder(() => {
    //这里因为是树结构,必然要定义出进深?
    //主要是非动态菜单,都共享在同一个stateHolder里面
    MenuSubContext.useProvider(selfRef)
    selfRef.current.container = render(selfRef.current)
  })
}

function subContain(sub: SubPanel, n: Node) {
  while (sub) {
    if (sub.container.contains(n)) {
      return true
    }
    sub = sub.child?.current!
  }
  return false
}
function subAndTriggerContain(trigger: HTMLElement, sub: SubPanel, n: Node) {
  if (trigger.contains(n)) {
    return true
  } else {
    return subContain(sub, n)
  }
}
/**
 * 是需要层级的hover影响
 * @param config 
 */
export function renderMenuberSub(
  config: {
    inset?: boolean
    renderTrigger: (props: {
      className: string
      onMouseEnter: EmptyFun
    }, renderIcon: EmptyFun) => HTMLElement,
    renderContent: (props: {
      className: string
    }) => void
  },
) {
  const [open, setOpen] = useChange(false)
  renderMenuCtx(sub => {
    useEffect(() => {
      function mouseLeave(e: MouseEvent) {
        const n = e.target as Node
        if (!subAndTriggerContain(trigger, sub, n)) {
          setOpen(false)
        }
      }
      document.addEventListener("mouseover", mouseLeave)
      return () => {
        document.removeEventListener("mouseover", mouseLeave)
      }
    }, emptyArray)
    const trigger = config.renderTrigger({
      className: cn(tw`flex cursor-default select-none 
items-center rounded-sm px-2 py-1.5 text-sm outline-none 
hover:bg-accent hover:text-accent-foreground`,
        open ? 'bg-accent text-accent-foreground' : '',
        config.inset ? 'pl-8' : ''
      ),
      onMouseEnter() {
        setOpen(true)
      }
    }, () => {
      renderChevronRightIcon({
        className: `ml-auto h-4 w-4`
      })
    })
    let dir = ""
    let dircls = ''
    if (dir == 'left') {
      dircls = tw`slide-in-from-right-2 `
    } else if (dir == 'right') {
      dircls = tw`slide-in-from-left-2 `
    } else if (dir == 'top') {
      dircls = tw`slide-in-from-bottom-2 `
    } else if (dir == 'bottom') {
      dircls = tw`slide-in-from-top-2 `
    }
    return renderPortalPop(trigger, open, {
      exitDelay: 150,
      direction: "x",
      align: "start",
      alignOffset: 0,
      sideOffset: 0
    }, () => {
      config.renderContent({
        className: cn(`z-50 min-w-[8rem] 
    overflow-hidden 
    rounded-md border 
    bg-popover p-1 
    text-popover-foreground shadow-lg`,
          dircls,
          open ? 'animate-in fade-in-0 zoom-in-95' : 'animate-out fade-out-0 zoom-out-95'
        )
      })
    })
  })
}
/**
 * 实验不成功
 * @returns 
 */
export function renderMenubarHover() {
  let dir = 'bottom' as DIR

  let dircls = ''
  if (dir == 'left') {
    dircls = tw`slide-in-from-right-2 `
  } else if (dir == 'right') {
    dircls = tw`slide-in-from-left-2 `
  } else if (dir == 'top') {
    dircls = tw`slide-in-from-bottom-2 `
  } else if (dir == 'bottom') {
    dircls = tw`slide-in-from-top-2 `
  }

  return [
    tw`flex cursor-default select-none 
items-center rounded-sm 
px-3 py-1 text-sm font-medium outline-none 
relative
hover:bg-accent hover:text-accent-foreground 
group
`,
    cn(`z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1
text-popover-foreground shadow-md

absolute

duration-5000

pointer-events-none
animate-out 
fade-out-100
zoom-out-95
opacity-0

group-hover:opacity-100
group-hover:pointer-events-auto
group-hover:animate-in 
group-hover:fade-in-0 
group-hover:zoom-in-95

`,
      dircls,
    )
  ] as const
}

export function menubarItem(props?: { inset?: any, disabled?: boolean }) {
  return cn(
    `relative flex cursor-default select-none items-center
     rounded-sm text-sm outline-none py-1.5
     hover:bg-accent hover:text-accent-foreground
     px-2`,
    props?.disabled ? 'pointer-events-none opacity-50' : '',
    props?.inset ? 'pl-8' : ''
  )
}

export function renderMenubarIcon(props: {
  checked?: boolean
  render: (props: { className: string }) => void
}) {
  dom.span({
    className: `absolute left-2 flex h-3.5 w-3.5 items-center justify-center`
  }).render(() => {
    renderIf(props?.checked, () => {
      dom.span().render(() => {
        props.render({
          className: "h-4 w-4"
        })
      })
    })
  })
}

export function menubarLabel(inset?: any) {
  return cn(
    "px-2 py-1.5 text-sm font-semibold",
    inset ? "pl-8" : '',
  )
}
export function contextMenuLabel(inset?: any) {
  return cn(
    "px-2 py-1.5 text-sm font-semibold text-foreground",
    inset ? "pl-8" : '',
  )
}

export const menubarSeparator = tw`-mx-1 my-1 h-px bg-muted`
export const contextmenuSeparator = tw`-mx-1 my-1 h-px bg-border`


export const menubarShortcut = tw`ml-auto text-xs tracking-widest text-muted-foreground`