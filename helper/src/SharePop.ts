
import { useOneF } from "better-react";
import { useStoreTriggerRender } from "./useRefState";
import { valueCenterOf } from "./ValueCenter";
type FunElement = {
  render(): void
  id: any
}
function getId(v: FunElement) {
  return v.id
}
function renderContent(v: FunElement) {
  return [v.id, v.render] as const
}

function initSharePop(): {
  stacks: FunElement[]
  index: number
} {
  return {
    stacks: [],
    index: -1
  }
}
/**
 * pop只有一个,是一种弹窗路由.
 * 从router一样,应该使用组件本身作为key.
 * 只展示最后一个
 * 
 * 是否可以通过context传递useContent?
 * 当然可以包装在context里
 * @returns 
 */
export function createSharePop() {
  const popCenter = valueCenterOf(initSharePop())
  return {
    useProvider() {
      const { stacks, index } = useStoreTriggerRender(popCenter)
      const currentPop = stacks[index]

      useOneF(currentPop, renderContent)
    },
    push(render: () => void, id: any = render) {
      const { stacks, index } = popCenter.get()
      const newIndex = index + 1
      popCenter.set({
        stacks: stacks.slice(0, index).concat({
          render,
          id
        }),
        index: newIndex
      })
    },
    replace(render: () => void, id: any = render) {
      const { stacks, index } = popCenter.get()
      popCenter.set({
        stacks: stacks.slice(0, index - 1).concat({
          render,
          id
        }),
        index
      })
    },
    go(n: number) {
      if (n != 0) {
        const { stacks, index } = popCenter.get()
        let newIndex = index + n
        if (newIndex < 0) {
          newIndex = 0
        } else if (newIndex >= stacks.length) {
          newIndex = stacks.length - 1
        }
        popCenter.set({
          index: newIndex,
          stacks
        })
      }
    }
  }
}