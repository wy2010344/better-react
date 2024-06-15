import { dom } from "better-react-dom"
import { useEffect } from "better-react-helper"
import { emptyArray, run } from "wy-helper"
import * as d3 from "d3";

export default function () {

  const canvas = dom.canvas({
    width: 800,
    height: 800
  }).render()


  useEffect(() => {
    const width = 800
    const data = run(() => {
      const n = 20;
      const nodes = Array.from({ length: n * n }, (_, i) => ({ index: i }));
      const links = [];
      for (let y = 0; y < n; ++y) {
        for (let x = 0; x < n; ++x) {
          if (y > 0) links.push({ source: (y - 1) * n + x, target: y * n + x });
          if (x > 0) links.push({ source: y * n + (x - 1), target: y * n + x });
        }
      }
      return { nodes, links };
    })

    const height = width;
    const links = data.links.map(d => Object.create(d));
    const nodes = data.nodes.map(d => Object.create(d));

    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-30))
      .force("link", d3.forceLink(links).strength(1).distance(20).iterations(10))
      .on("tick", ticked);

    const drag = d3.drag()
      .subject(({ x, y }) => simulation.find(x - width / 2, y - height / 2, 40))
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

    const context = canvas.getContext("2d")!

    function ticked() {
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(width / 2, height / 2);
      context.beginPath();
      for (const d of links) {
        context.moveTo(d.source.x, d.source.y);
        context.lineTo(d.target.x, d.target.y);
      }
      context.strokeStyle = "#aaa";
      context.stroke();
      context.beginPath();
      for (const d of nodes) {
        context.moveTo(d.x + 3, d.y);
        context.arc(d.x, d.y, 3, 0, 2 * Math.PI);
      }
      context.fill();
      context.strokeStyle = "#fff";
      context.stroke();
      context.restore();
    }

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    d3.select(context.canvas).call(drag).node();

    return () => simulation.stop()
  }, emptyArray)
}