import { useMap } from "better-react";
import { useOnlyId } from "./useOnlyId";
import { useStoreTriggerRender } from "./useRefState";
import { useValueCenterWith, ValueCenter, valueCenterOf } from "./ValueCenter";





type FunElement<T extends (...vs: any[]) => void> = [T, ...(Parameters<T>)]
type NotifyProps = {
  id: number
  element: ValueCenter<FunElement<any>>
}

function getId(v: NotifyProps) {
  return v.id
}
function renderContent(v: NotifyProps) {
  const [fun, ...args] = useStoreTriggerRender(v.element)
  return fun(...args)
}
/**
 * notify有多个
 * 从router一样,应该使用组件本身作为key.
 * 
 * 可能有多种操作列表
 * @returns 
 */
export function createSharePop() {
  const notifyCenter = valueCenterOf<NotifyProps[]>([])
  return {
    useProvider() {
      const notifys = useStoreTriggerRender(notifyCenter)
      return useMap(notifys, getId, renderContent)
    },
    useContent(...vs: FunElement<any>) {
      const store = useValueCenterWith(vs)
      store.set(vs)
      return store
    },
    store: notifyCenter
  }
}