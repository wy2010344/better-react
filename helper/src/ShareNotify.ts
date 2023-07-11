import { renderMap } from "./renderMap";
import { getOnlyId } from "./useOnlyId";
import { useStoreTriggerRender, valueCenterOf } from "./ValueCenter";





type NotifyProps = {
  id: number
  render(): void
}

function getId(v: NotifyProps) {
  return v.id
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
export function createSharePop() {
  const notifyCenter = valueCenterOf<NotifyProps[]>([])
  return {
    useProvider() {
      const notifys = useStoreTriggerRender(notifyCenter)
      return renderMap(notifys, getId, renderContent)
    },
    /**返回销毁事件*/
    add(render: () => void) {
      const id = getOnlyId()
      notifyCenter.set(notifyCenter.get().concat({
        id,
        render
      }))
      return function () {
        notifyCenter.set(notifyCenter.get().filter(v => v.id != id))
      }
    }
  }
}