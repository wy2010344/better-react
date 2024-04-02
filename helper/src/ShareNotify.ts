import { getOnlyId } from "./useOnlyId";
import { valueCenterOf } from "wy-helper";
import { useStoreTriggerRender } from "./useStoreTriggerRender";
import { StoreValueCreater, RenderMapStoreValueCreater } from "better-react";





type NotifyProps = {
  id: number
  config: StoreValueCreater
  render(): void
}

function getId(v: NotifyProps) {
  return v.id
}
function getConfig(v: NotifyProps) {
  return v.config
}
function renderContent(v: NotifyProps) {
  v.render()
}
/**
 * notify有多个
 * 从router一样,应该使用组件本身作为key.
 * 
 * 可能有多种操作列表
 * @returns 
 */
export function createSharePop(
  storeValueCreater: RenderMapStoreValueCreater,
) {
  const notifyCenter = valueCenterOf<NotifyProps[]>([])
  return {
    useProvider() {
      const notifys = useStoreTriggerRender(notifyCenter)
      // return renderArray(storeValueCreater, notifys, getId, getConfig, renderContent)
    },
    /**返回销毁事件*/
    add(config: StoreValueCreater, render: () => void) {
      const id = getOnlyId()
      notifyCenter.set(notifyCenter.get().concat({
        id,
        config,
        render
      }))
      return function () {
        notifyCenter.set(notifyCenter.get().filter(v => v.id != id))
      }
    }
  }
}