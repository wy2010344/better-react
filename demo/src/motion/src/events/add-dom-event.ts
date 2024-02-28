export function addDomEvent(
  target: EventTarget,
  eventName: string,
  handler: (v: any) => void,
  options: AddEventListenerOptions = { passive: true }
) {
  target.addEventListener(eventName, handler, options)

  return () => target.removeEventListener(eventName, handler)
}
