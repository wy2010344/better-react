import { useMap, useOne } from "better-react";
import { useIf } from "./useGuard";
import { useOnlyId } from "./useOnlyId";
import { useStoreTriggerRender } from "./useRefState";
import { useValueCenter, useValueCenterWith, ValueCenter, valueCenterOf } from "./ValueCenter";





type FunElement<T extends (...vs: any[]) => void> = [T, ...(Parameters<T>)]


function getId(v: FunElement<any>) {
  return v[0]
}
function renderContent(v: FunElement<any>) {
  const [fun, ...args] = v
  fun(...args)
}

function initSharePop(): {
  stacks: ValueCenter<FunElement<any>>[]
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
      useIf(currentPop, function () {
        const element = useStoreTriggerRender(currentPop)
        useOne(element, getId, renderContent)
      })
    },
    useContent(...vs: FunElement<any>) {
      const store = useValueCenterWith(vs)
      store.set(vs)
      return {
        push() {
          const { stacks, index } = popCenter.get()
          const newIndex = index + 1
          popCenter.set({
            stacks: stacks.slice(0, index).concat(store),
            index: newIndex
          })
        },
        replace() {
          const { stacks, index } = popCenter.get()
          popCenter.set({
            stacks: stacks.slice(0, index - 1).concat(store),
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
  }
}