import { GetValue, asLazy } from "wy-helper";
import { SetV, Node } from "./model";


export default function (ix?: number | SetV) {
  var strength: SetV = asLazy(0.1),
    nodes: Node[],
    strengths: number[],
    xz: number[];

  let x: SetV = typeof ix !== "function"
    ? asLazy(ix == null ? 0 : +ix)
    : ix;
  function force(alpha: number) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    xz = new Array(n);
    for (i = 0; i < n; ++i) {
      const z = +x(nodes[i], i, nodes)
      xz[i] = z
      strengths[i] = isNaN(z)
        ? 0
        : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function (_: Node[]) {
    nodes = _;
    initialize();
  };

  force.strength = function (_?: number | SetV) {
    return arguments.length
      ? (strength = typeof _ === "function"
        ? _
        : asLazy(+_!),
        initialize(),
        force)
      : strength;
  };

  force.x = function (_?: number | SetV) {
    return arguments.length
      ? (x = typeof _ === "function"
        ? _
        : asLazy(+_!),
        initialize(),
        force)
      : x;
  };

  return force;
}