
import { useEffect } from "../better-react/fc"
import { ValueCenter, useStoreTriggerRender } from "./ValueCenter"
import Better from '../better-react'



export function createSharePortal() {
  const portals = ValueCenter.of<JSX.Element[]>([])
  let uid = 0
  return {
    uid,
    usePortals() {
      return useStoreTriggerRender(portals)
    },
    PortalCall({ children }: { children(i: number): JSX.Element }) {
      useStoreTriggerRender(portals)
      useEffect(() => {
        const id = uid++
        portals.set(portals.get().concat(children(id)))
        return () => {
          portals.set(portals.get().filter(v => v.key != id))
        }
      }, [])
      return <></>
    },
    Portal({ children }: { children: JSX.Element }) {
      useStoreTriggerRender(portals)
      useEffect(() => {
        const ids: number[] = []
        children.forEach(function (child: any) {
          const id = uid++
          ids.push(id)
          const portal = { ...child, props: { ...child.props, key: id } }
          console.log("portal", portal.props.children)
          portals.set(portals.get().concat(portal))
        })
        return () => {
          portals.set(portals.get().filter(v => !ids.includes(v.key)))
        }
      }, [])
      return <></>
    },
    PortalFragmet({ children }: { children: JSX.Element }) {
      useStoreTriggerRender(portals)
      useEffect(() => {
        const id = uid++
        portals.set(portals.get().concat(<Better.createFragment key={id}>
          {children}
        </Better.createFragment>))
        return () => {
          portals.set(portals.get().filter(v => v.key != id))
        }
      }, [])
      return <></>
    }
  }
}