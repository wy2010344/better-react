import { dom } from "better-react-dom";
import { useEffect } from "better-react-helper";
import * as d3 from "d3";
import { emptyArray, run } from "wy-helper";

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
    const nodes = data.map(Object.create);

    const simulation = d3.forceSimulation(nodes)
      .alphaTarget(0.3) // stay hot
      .velocityDecay(0.1) // low friction
      .force("x", d3.forceX().strength(0.01))
      .force("y", d3.forceY().strength(0.01))
      .force("collide", d3.forceCollide().radius(d => d.r + 1).iterations(3))
      .force("charge", d3.forceManyBody().strength((d, i) => i ? 0 : -width * 2 / 3))
      .on("tick", ticked);

    d3.select(context.canvas)
      .on("touchmove", event => event.preventDefault())
      .on("pointermove", pointermoved);
    function pointermoved(event: PointerEvent) {
      const [x, y] = d3.pointer(event);
      nodes[0].fx = x - width / 2;
      nodes[0].fy = y - height / 2;
    }

    function ticked() {
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(width / 2, height / 2);
      for (let i = 1; i < nodes.length; ++i) {
        const d = nodes[i];
        context.beginPath();
        context.moveTo(d.x + d.r, d.y);
        context.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
        context.fillStyle = color(d.group);
        context.fill();
      }
      context.restore();
    }
    return () => simulation.stop()
  }, emptyArray)
}