import { createContext } from "better-react"
import usePanel, { PanelParams, Size } from "./renderPanel"
import { useState } from "better-react-helper"

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
export function panelWith<T>(render: (
  operate: PanelOperate,
  id: number,
  value: T
) => Omit<PanelParams, "close" | "moveFirst">): PanelCallback<T> {
  return function (operate, value) {
    const id = operate.push(function () {
      const args = render(operate, id, value)
      usePanel({
        ...args,
        close() {
          operate.close(id)
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
  const callback = panelWith(function (o, id) {
    return {
      children(p, b) {
        children(o, id)
      }
    }
  })
  return function (operate: PanelOperate) {
    callback(operate, null)
  }
}


export const CountContext = createContext(0)





export function usePortalPanel(args: Omit<PanelParams, "portalTarget" | "moveFirst"> & Size) {
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