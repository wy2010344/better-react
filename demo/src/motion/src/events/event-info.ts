import { EventInfo } from "./types";
import { isPrimaryPointer } from "./utils/is-primary-pointer";

export type EventListenerWithPointInfo = (
  e: PointerEvent,
  info: EventInfo
) => void


export function extractEventInfo(
  event: PointerEvent,
  pointType: "page" | "client" = "page"
): EventInfo {
  return {
    point: {
      //@ts-ignore
      x: event[pointType + "X"],
      //@ts-ignore
      y: event[pointType + "Y"],
    },
  }
}

export const addPointerInfo = (
  handler: EventListenerWithPointInfo
) => {
  return (event: PointerEvent) =>
    isPrimaryPointer(event) && handler(event, extractEventInfo(event))
}
