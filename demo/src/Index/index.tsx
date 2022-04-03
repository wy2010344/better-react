
import { createElement } from 'better-react-dom'
import { Fragment, findContext, useEffect, createContext, useRefValue } from 'better-react'
import { useStoreTriggerRender, ValueCenter } from "better-react-helper"
import PanelReact from "../drag/PanelReact"
import prolog from "./prolog"
import Prolog from "./prolog"
import 测试createPortal from "./测试createPortal"

import 首页 from './首页'

export type RouteFun<T> = (params: {
  args: T,
  moveToFirst(): void
  close(): void
}) => JSX.Element
const routes = {
  prolog,
  首页,
  测试createPortal
} as const


type Route = typeof routes

type Params<K extends keyof Route> = Route[K] extends { args: infer ARG } ? ARG : unknown
const PanelContext = createContext({
  navigate<K extends keyof Route>(path: K, params: Params<K>) {
    console.log("no route")
  },
  push<K extends keyof Route>(path: K, params: Params<K>) {
    console.log("no route")
  }
})

export function findPanel() {
  return findContext(PanelContext)
}
let globalUID = 0

type HistoryRow<K extends keyof Route> = {
  key: string
  path: K
  params: Params<K>
}


export default function index() {

  const historys = useRefValue(() => ValueCenter.of<HistoryRow<keyof Route>[]>([]))()
  return (
    <Fragment contexts={[PanelContext.provide({
      navigate(path, params) {
        const list = historys.get()
        const index = list.findIndex(v => v.path == path)
        let key = ''
        if (index < 0) {
          key = `panel-${globalUID++}`
        } else {
          const [old] = list.splice(index, 1)
          key = old.key
        }
        const nList = list.concat({
          key,
          path,
          params
        })
        historys.set(nList)
      },
      push(path, params) {
        const list = historys.get()
        historys.set(list.concat({
          key: `panel-${globalUID++}`,
          path,
          params
        }))
      }
    })]}>
      <RenderHost historys={historys} />
      <FirstPage />
    </Fragment>
  )
}
function RenderHost({ historys }: { historys: ValueCenter<HistoryRow<keyof Route>[]> }) {
  const vs = useStoreTriggerRender(historys)
  return <>{vs.map(v => {
    const route = routes[v.path]
    return <Fragment key={v.key} >{route({
      args: v.params as any,
      moveToFirst() {
        const list = historys.get()
        const idx = list.findIndex(x => x.key == v.key)
        if (idx < 0) {
          console.error("不正确，idx小于0")
          // } else if (idx == list.length - 1) {
          //   console.log('无需处理')
        } else {
          const [row] = list.splice(idx, 1)
          historys.set(list.concat(row))
        }
      },
      close() {
        const list = historys.get()
        const idx = list.findIndex(x => x.key == v.key)
        if (idx < 0) {
          console.error("不正确，idx小于0")
        } else {
          list.splice(idx, 1)
          historys.set(list.slice())
        }
      }
    })}</Fragment>
  })}</>
}


function FirstPage() {
  const { navigate } = findPanel()

  useEffect(() => {
    navigate("首页", null)
  }, [])
  return <>

  </>

}