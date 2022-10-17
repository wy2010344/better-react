
import { useEffect } from "better-react"
import { useOnlyId } from "./useOnlyId"
import { useStoreTriggerRender } from "./useRefState"
import { useValueCenterWith } from "./ValueCenter"


export interface XElement {
  props: {
    key?: string | number | null
  }
}
export function createSharePortal() {
  const portals = useValueCenterWith<XElement[]>([])

  function buildDestroy(id: string, p: XElement) {
    useEffect(() => {
      const ps = portals.get()
      const idx = ps.findIndex(v => v.props?.key == id)
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
        portals.set(portals.get().filter(v => v.props?.key != id))
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
      buildDestroy(id, { ...children, props: { ...children.props, key: id } })
      return null
    }
  }
}