import { createSharePortal } from "better-react-helper"




export const { Portal, usePortals, portals, PortalCall } = createSharePortal()
export function moveFirst(id: string) {
  const vs = portals.get()
  const idx = vs.findIndex(v => v.props.key == id)
  console.log(idx)
  if (idx < 0) {
    console.log("出现了什么事？", vs.map(v => v.props.key).join("|"))
  } else {
    const [d] = vs.splice(idx, 1)
    portals.set(vs.concat(d))
  }
}

export function removePanel(id: string) {
  portals.set(portals.get().filter(v => v.props.key != id))
}