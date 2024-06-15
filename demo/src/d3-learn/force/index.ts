

import { dom, svg as s } from "better-react-dom";
import { createUseReducer, renderArray, useAtom, useChange, useEffect, useMemo, useSideReducer } from "better-react-helper";
import * as d3 from "d3";
import { emptyArray, emptyFun } from "wy-helper";
import data from './graph.json'
import { hookMakeDirtyAndRequestUpdate } from "better-react";
import { PagePoint, dragInit, initDrag, subscribeDragMove } from "wy-dom-helper";
import forceSimulation from './lib/simulation'
import forceX from './lib/x'
import forceManyBody from './lib2/manyBody'
import forceLink from './lib2/link'
import { ForceLink, ForceModel, ForceNode, initForceModel, initToForceNode, initToNode, simpleCloneLinks, tickForce } from "./lib2/reducerForce";
import dir from "./lib2/dir";
import { createUseSideReducer } from 'better-react-helper'
const width = 800
const height = 800

type NType = typeof data.nodes[number]

let alphaMin = 0.001
export default function () {

  const svg = s.svg({
    width,
    height,
    viewBox: `${-width / 2} ${-height / 2} ${width} ${height}`,
    style: `max-width: 100%; height: auto;`
  }).render(function () {
    const { initModel, useRd, color } = useMemo(() => {
      const color = d3.scaleOrdinal(d3.schemeCategory10);
      const nodes = initToForceNode(data.nodes, 2)
      function getNode(id: string) {
        let value = nodes.find(v => v.value.id == id)
        if (!value) {
          value = initToNode({
            id
          } as any, 2, nodes.length)
          nodes.push(value)
        }
        return value
      }
      const links: ForceLink<number, NType>[] = data.links.map(link => {
        return {
          source: getNode(link.source),
          target: getNode(link.target),
          value: link.value
        }
      })

      const initModel = initForceModel(nodes, links, {
        link: forceLink(),
        charge: forceManyBody(),
        x: dir("x"),
        y: dir("y")
      })

      const useRd = createUseSideReducer(function (model: ForceModel<NType, number>, action: {
        type: "tick"
      } | {
        type: "drag",
        node: ForceNode<NType>
        e: PagePoint
        start?: boolean
      } | {
        type: "endDrag",
        node: ForceNode<NType>
      }) {
        if (action.type == "tick") {
          return [tickForce(model)]
        } else if (action.type == "drag") {
          const nodes = model.nodes.map(v => {
            if (v.index == action.node.index) {
              const rec = svg.getBoundingClientRect()
              return {
                ...v,
                x: {
                  ...v.x,
                  f: action.e.pageX - rec.left - rec.width / 2
                },
                y: {
                  ...v.y,
                  f: action.e.pageY - rec.top - rec.height / 2
                },
              }
            }
            return v
          })
          if (action.start) {
            return [{
              ...model,
              alphaTarget: 0.3,
              nodes,
              links: simpleCloneLinks(model.links, nodes)
            }, dispatch => {
              dispatch({ type: "tick" })
            }]
          }
          return [{
            ...model,
            nodes,
            links: simpleCloneLinks(model.links, nodes)
          }]
        } else if (action.type == "endDrag") {
          //重新开始评估
          const nodes = model.nodes.map(v => {
            if (v.index == action.node.index) {
              return {
                ...v,
                x: {
                  ...v.x,
                  f: undefined
                },
                y: {
                  ...v.y,
                  f: undefined
                },
              }
            }
            return v
          })
          return [{
            ...model,
            alphaTarget: 0,
            nodes,
            links: simpleCloneLinks(model.links, nodes)
          }]
        }
        return [model]
      })
      return {
        initModel,
        useRd,
        color
      }
    })

    const [{ nodes, links, alpha }, dispatch] = useRd(initModel)
    useEffect(() => {
      if (alpha < alphaMin) {
        return
      }
      dispatch({
        type: "tick"
      })
    }, [alpha])

    links.forEach(link => {
      s.g({
        stroke: "#999",
        strokeOpacity: 0.6,
      }).render(() => {
        s.line({
          x1: link.source.x.d,
          y1: link.source.y.d,
          x2: link.target.x.d,
          y2: link.target.y.d,
          strokeWidth: Math.sqrt(link.value)
        }).render()
      })
    })

    renderArray(nodes, v => v.value.id, function (node) {

      const onDrag = useAtom(false)
      s.g({
        stroke: "#fff",
        strokeWidth: 1.5,
      }).render(() => {
        useEffect(() => {
          return subscribeDragMove(e => {
            if (onDrag.get()) {
              if (e) {
                dispatch({
                  type: "drag",
                  node,
                  e
                })
              } else {
                onDrag.set(false)
                dispatch({
                  type: "endDrag",
                  node
                })
              }
            }
          })
        }, emptyArray)
        s.circle({
          r: 5,
          cx: node.x.d,
          cy: node.y.d,
          fill: color(node.value.group),
          ...(dragInit(e => {
            onDrag.set(true)
            dispatch({
              type: "drag",
              start: true,
              node,
              e
            })
          }))
        }).render()
      })
    })
  })
}