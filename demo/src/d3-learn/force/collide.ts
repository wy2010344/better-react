import { dom } from "better-react-dom";
import { useEffect } from "better-react-helper";
import * as d3 from "d3";
import { asLazy, emptyArray, run } from "wy-helper";
import { initForceModel, initToForceNode, initToNode, tickForce } from "./lib2/reducerForce";
import dir from "./lib2/dir";
import collide from "./lib2/collide";
import manyBody from "./lib2/manyBody";
import { subscribeRequestAnimationFrame } from "wy-dom-helper";

/**
 * 碰撞力
 */
export default function () {
  const canvas = dom.canvas({
    width: 800,
    height: 800
  }).render()


  useEffect(() => {
    const width = 800
    const data = run(() => {
      const k = width / 200;
      const r = d3.randomUniform(k, k * 4);
      const n = 4;
      return Array.from({ length: 200 }, (_, i) => ({ r: r(), group: i && (i % n + 1) }));
    })


    const height = width;
    const color = d3.scaleOrdinal(d3.schemeTableau10);
    const context = canvas.getContext("2d")!

    let model = initForceModel(initToForceNode(data, 2), [], {
      x: dir("x", {
        getStrength: asLazy(0.01)
      }),
      y: dir("y", {
        getStrength: asLazy(0.01)
      }),
      collide: collide({
        getRadius(n) {
          return n.value.r + 1
        },
        iterations: 3
      }),
      charge: manyBody({
        getStrenth(n) {
          return n.index ? 0 : -width * 2 / 3
        },
      })
    })
    model.alphaTarget = 0.3
    model.velocityDecay = 1 - 0.1

    d3.select(context.canvas)
      .on("touchmove", event => event.preventDefault())
      .on("pointermove", pointermoved);
    function pointermoved(event: PointerEvent) {
      const [x, y] = d3.pointer(event);
      const n0 = model.nodes[0]
      n0.x.f = x - width / 2;
      n0.y.f = y - height / 2;
    }

    function ticked() {
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(width / 2, height / 2);
      const nodes = model.nodes
      for (let i = 1; i < nodes.length; ++i) {
        const d = nodes[i];
        context.beginPath();
        context.moveTo(d.x.d + d.value.r, d.y.d);
        context.arc(d.x.d, d.y.d, d.value.r, 0, 2 * Math.PI);
        context.fillStyle = color(d.value.group + "");
        context.fill();
      }
      context.restore();
    }
    return subscribeRequestAnimationFrame(() => {
      model = tickForce(model)
      ticked()
    })
    // return () => simulation.stop()
  }, emptyArray)
}