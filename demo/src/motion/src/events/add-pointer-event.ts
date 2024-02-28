import { addDomEvent } from "./add-dom-event";
import { EventListenerWithPointInfo, addPointerInfo } from "./event-info";

export function addPointerEvent(
  target: EventTarget,
  eventName: string,
  handler: EventListenerWithPointInfo,
  options?: AddEventListenerOptions
) {
  return addDomEvent(target, eventName, addPointerInfo(handler), options)
}
