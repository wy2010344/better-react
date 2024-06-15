import { dom } from "better-react-dom"
import { addEffectDestroy, useEffect, useHookEffect } from "better-react-helper"
import { asLazy, emptyArray, run } from "wy-helper"
import * as d3 from "d3";
import { ForceLink, ForceNode, findNode, initForceModel, initToForceNode, initToNode, tickForce } from "./lib2/reducerForce";
import manyBody from "./lib2/manyBody";
import link from "./lib2/link";
import { PagePoint, subscribeDragInit, subscribeDragMove, subscribeRequestAnimationFrame } from "wy-dom-helper";

export default function () {

  const canvas = dom.canvas({
    width: 800,
    height: 800
  }).render()


  useHookEffect(() => {
    const width = 800
    const data = run(() => {
      const n = 20;
      const nodes: {
        index: number
      }[] = Array.from({ length: n * n }, (_, i) => ({ index: i }));
      const links: {
        source: number
        target: number
      }[] = [];
      for (let y = 0; y < n; ++y) {
        for (let x = 0; x < n; ++x) {
          if (y > 0) links.push({ source: (y - 1) * n + x, target: y * n + x });
          if (x > 0) links.push({ source: y * n + (x - 1), target: y * n + x });
        }
      }
      return { nodes, links };
    })

    const height = width;
    const nodes = initToForceNode(data.nodes, 2)

    function getNode(id: number) {
      let value = nodes.find(v => v.value.index == id)
      if (!value) {
        value = initToNode({
          index: nodes.length
        }, 2, nodes.length)
        nodes.push(value)
      }
      return value
    }
    const links: ForceLink<undefined, { index: number }>[] = data.links.map(link => {
      return {
        source: getNode(link.source),
        target: getNode(link.target),
        value: undefined
      }
    })
    let model = initForceModel(nodes, links, {
      charge: manyBody({
        getStrenth: asLazy(-30)
      }),
      link: link({
        getStrength: asLazy(1),
        getDistance: asLazy(20),
        iterations: 10
      })
    })

    const context = canvas.getContext("2d")!

    function ticked() {
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(width / 2, height / 2);
      context.beginPath();
      for (const d of links) {
        context.moveTo(d.source.x.d, d.source.y.d);
        context.lineTo(d.target.x.d, d.target.y.d);
      }
      context.strokeStyle = "#aaa";
      context.stroke();
      context.beginPath();
      for (const d of nodes) {
        context.moveTo(d.x.d + 3, d.y.d);
        context.arc(d.x.d, d.y.d, 3, 0, 2 * Math.PI);
      }
      context.fill();
      context.strokeStyle = "#fff";
      context.stroke();
      context.restore();
    }

    addEffectDestroy(subscribeRequestAnimationFrame(() => {
      model = tickForce(model)
      ticked()
    }))

    let dragNode: ForceNode<number> | undefined = undefined

    function updateDrag(dragNode: ForceNode<number>, e: PagePoint) {

      dragNode.x.f = e.clientX - width / 2
      dragNode.y.f = e.clientY - height / 2
    }
    addEffectDestroy(subscribeDragInit(canvas, e => {
      dragNode = findNode(model.nodes, 40, e.clientX - width / 2, e.clientY - height / 2)
      if (dragNode) {
        model.alphaTarget = 0.3
        updateDrag(dragNode, e)
      }
    }))
    addEffectDestroy(subscribeDragMove(e => {
      if (dragNode) {
        if (e) {
          updateDrag(dragNode, e)
        } else {
          model.alphaTarget = 0
          dragNode.x.f = undefined
          dragNode.y.f = undefined
          dragNode = undefined
        }
      }
    }))
  }, emptyArray)
}