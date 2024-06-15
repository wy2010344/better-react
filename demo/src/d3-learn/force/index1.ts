

import { dom, svg as s } from "better-react-dom";
import { useEffect, useMemo } from "better-react-helper";
import * as d3 from "d3";
import { emptyArray } from "wy-helper";
import data from './graph.json'
import { hookMakeDirtyAndRequestUpdate } from "better-react";
import { dragInit } from "wy-dom-helper";
import forceSimulation from './lib/simulation'
import forceX from './lib/x'
import forceManyBody from './lib/manyBody'
import forceLink from './lib/link'
const width = 800
const height = 800
export default function () {

  const svg = s.svg({
    width,
    height,
    viewBox: `${-width / 2} ${-height / 2} ${width} ${height}`,
    style: `max-width: 100%; height: auto;`
  }).render(function () {
    const makeDirty = hookMakeDirtyAndRequestUpdate()
    const { links, nodes, simulation, color } = useMemo(() => {
      const links = data.links.map(d => ({ ...d }));
      const nodes = data.nodes.map(d => ({ ...d }));
      const color = d3.scaleOrdinal(d3.schemeCategory10);
      const simulation = forceSimulation(nodes)
        .force("link", forceLink(links).id(d => d.id))
        .force("charge", forceManyBody())
        .force("x", forceX())
        .force("y", d3.forceY());
      simulation.on("tick", () => {
        makeDirty()
      })
      return { links, nodes, simulation, color }
    })
    links.forEach(link => {
      s.g({
        stroke: "#999",
        strokeOpacity: 0.6,
      }).render(() => {
        s.line({
          x1: link.source.x,
          y1: link.source.y,
          x2: link.target.x,
          y2: link.target.y,
          strokeWidth: Math.sqrt(link.value)
        }).render()
      })
    })

    nodes.forEach(node => {
      s.g({
        stroke: "#fff",
        strokeWidth: 1.5,
      }).render(() => {
        s.circle({
          r: 5,
          cx: node.x,
          cy: node.y,
          fill: color(node.group),
          ...(dragInit(e => {

          }))
        }).render()
      })
    })
    useEffect(() => {
      // Specify the color scale.
      // // Add a line for each link, and a circle for each node.
      // const link = svg.append("g")
      //   .attr("stroke", "#999")
      //   .attr("stroke-opacity", 0.6)
      //   .selectAll("line")
      //   .data(links)
      //   .join("line")
      //   .attr("stroke-width", d => Math.sqrt(d.value));

      // const node = svg.append("g")
      //   .attr("stroke", "#fff")
      //   .attr("stroke-width", 1.5)
      //   .selectAll("circle")
      //   .data(nodes)
      //   .join("circle")
      //   .attr("r", 5)
      //   .attr("fill", d => color(d.group));

      // node.append("title")
      //   .text(d => d.id);

      // Add a drag behavior.
      // node.call(d3.drag()
      //   .on("start", dragstarted)
      //   .on("drag", dragged)
      //   .on("end", dragended));

      // // Set the position attributes of links and nodes each time the simulation ticks.


      // Reheat the simulation when drag starts, and fix the subject position.
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      // Update the subject (dragged node) position during drag.
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      // Restore the target alpha so the simulation cools after dragging ends.
      // Unfix the subject position now that it’s no longer being dragged.
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      // When this cell is re-run, stop the previous simulation. (This doesn’t
      // really matter since the target alpha is zero and the simulation will
      // stop naturally, but it’s a good practice.)
      return () => simulation.stop()
    }, emptyArray)
  })


}