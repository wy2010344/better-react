import { createContext } from "better-react"
import usePanel from "./usePanel"

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


export type PanelCallback = (
  operate: PanelOperate
) => void

export function normalPanel(
  callback: (operate: PanelOperate, id: number) => void
): PanelCallback {
  return function (operate) {
    const id = operate.push(function () {
      usePanel({
        close() {
          operate.close(id)
        },
        children() {
          callback(operate, id)
        },
        moveFirst() {
          operate.moveToFirst(id)
        }
      })
    })
  }
}


export const CountContext = createContext(0)