
import { GetValue, asLazy } from "wy-helper";
import jiggle from "./jiggle";
import { DIMType, Link, Node, SetL, SetV } from './model'

function index(d: Node) {
  return d.index;
}

function find(nodeById: Map<number, Node>, nodeId: number) {
  var node = nodeById.get(nodeId);
  if (!node) throw new Error("node not found: " + nodeId);
  return node;
}

export default function (links: Link[] = []) {
  var id: SetV = index,
    strength: SetL = defaultStrength,
    strengths: number[],
    distance: SetL = asLazy(30),
    distances: number[],
    nodes: Node[],
    nDim: DIMType,
    count: number[],
    bias: number[],
    random: GetValue<number>,
    iterations = 1;

  function defaultStrength(link: Link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }

  function force(alpha: number) {
    for (var k = 0, n = links.length; k < iterations; ++k) {
      for (var i = 0, link, source, target, x = 0, y = 0, z = 0, l, b; i < n; ++i) {
        link = links[i], source = link.source, target = link.target;
        x = target.x + target.vx - source.x - source.vx || jiggle(random);
        if (nDim > 1) { y = target.y + target.vy - source.y - source.vy || jiggle(random); }
        if (nDim > 2) { z = target.z + target.vz - source.z - source.vz || jiggle(random); }
        l = Math.sqrt(x * x + y * y + z * z);
        l = (l - distances[i]) / l * alpha * strengths[i];
        x *= l, y *= l, z *= l;

        target.vx -= x * (b = bias[i]);
        if (nDim > 1) { target.vy -= y * b; }
        if (nDim > 2) { target.vz -= z * b; }

        source.vx += x * (b = 1 - b);
        if (nDim > 1) { source.vy += y * b; }
        if (nDim > 2) { source.vz += z * b; }
      }
    }
  }

  function initialize() {
    if (!nodes) return;

    var i,
      n = nodes.length,
      m = links.length,
      nodeById = new Map<number, Node>(nodes.map((d, i) => [id(d, i, nodes), d])),
      link;

    for (i = 0, count = new Array(n); i < m; ++i) {
      link = links[i], link.index = i;
      if (typeof link.source !== "object") link.source = find(nodeById, link.source);
      if (typeof link.target !== "object") link.target = find(nodeById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }

    for (i = 0, bias = new Array(m); i < m; ++i) {
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }

    strengths = new Array(m), initializeStrength();
    distances = new Array(m), initializeDistance();
  }

  function initializeStrength() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      strengths[i] = +strength(links[i], i, links);
    }
  }

  function initializeDistance() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      distances[i] = +distance(links[i], i, links);
    }
  }

  force.initialize = function (
    _nodes: Node[],
    _random: GetValue<number> = Math.random,
    _nDim: DIMType = 2) {
    nodes = _nodes;
    random = _random
    nDim = _nDim
    initialize();
  };

  force.links = function (_) {
    return arguments.length ? (links = _, initialize(), force) : links;
  };

  force.id = function (_) {
    return arguments.length ? (id = _, force) : id;
  };

  force.iterations = function (_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function (_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : asLazy(+_), initializeStrength(), force) : strength;
  };

  force.distance = function (_) {
    return arguments.length ? (distance = typeof _ === "function" ? _ : asLazy(+_), initializeDistance(), force) : distance;
  };

  return force;
}