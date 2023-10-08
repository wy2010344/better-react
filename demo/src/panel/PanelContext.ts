import { createContext } from "better-react"
import usePanel, { PanelParams, Size } from "./renderPanel"

export type PanelCollection = {
  id: number
  callback(id: number): void
}[]

export type PanelOperate = {
  push(callback: () => void): number
  close(id: number): void
  exist(id: number): boolean
  moveToFirst(id: number): void
}
export const PanelContext = createContext<PanelOperate>({
  push() {
    throw new Error("")
  },
  exist() {
    throw new Error("")
  },
  moveToFirst() {
    throw new Error("")
  },
  close() {
    throw new Error("")
  }
})


export type PanelCallback<T> = (
  operate: PanelOperate,
  value: T
) => void
export function panelWith<T>({
  children,
  ...args
}: {
  children: (operate: PanelOperate, id: number, arg: T, size: Size, div: HTMLElement) => void,
} & Omit<PanelParams, "close" | "children" | "moveFirst">): PanelCallback<T> {

  return function (operate, value) {
    const id = operate.push(function () {
      usePanel({
        ...args,
        close() {
          operate.close(id)
        },
        children(size, div) {
          children(operate, id, value, size, div)
        },
        moveFirst() {
          operate.moveToFirst(id)
        },
      })
    })
  }
}
export function normalPanel(
  children: (operate: PanelOperate, id: number) => void,
) {
  const callback = panelWith({
    children
  })
  return function (operate: PanelOperate) {
    callback(operate, null)
  }
}


export const CountContext = createContext(0)





export function usePortalPanel(args: Omit<PanelParams, "portalTarget" | "moveFirst">) {
  const fiber = usePanel({
    ...args,
    // portalTarget() {
    //   return document.body
    // },
    moveFirst() {
      document.body.appendChild(fiber)
    }
  })
}