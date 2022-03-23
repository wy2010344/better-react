
import { useEffect } from "better-react"
import { useOnlyId } from "./useOnlyId"
import { ValueCenter, useStoreTriggerRender } from "./ValueCenter"


export interface XElement {
  key?: string | number | null
}
export function createSharePortal() {
  const portals = ValueCenter.of<XElement[]>([])

  function buildDestroy(id: string, p: XElement) {
    useEffect(() => {
      const ps = portals.get()
      const idx = ps.findIndex(v => v.key == id)
      console.log("更新portals", ps, id, p)
      if (idx < 0) {
        portals.set(ps.concat(p))
      } else {
        ps.splice(idx, 1, p)
        const vs = ps.slice()
        portals.set(vs)
      }
    }, [p])
    useEffect(function () {
      return () => {
        portals.set(portals.get().filter(v => v.key != id))
      }
    }, [])
  }
  return {
    portals,
    usePortals() {
      return useStoreTriggerRender(portals)
    },
    PortalCall({ children }: { children(i: string): XElement }) {
      const { id } = useOnlyId()
      console.log(children)
      buildDestroy(id, children(id))
      return null
    },
    Portal({ children }: { children: XElement }) {
      const { id } = useOnlyId()
      buildDestroy(id, { ...children, key: id })
      return null
    }
  }
}