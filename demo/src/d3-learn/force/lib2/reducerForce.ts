import { DIMType } from "../lib/model"





export type CallBackNode<T, F> = (node: ForceNode<T>, i: number, nodes: ForceNode<T>[]) => F
/**
 * 只是累积速度
 * 如果有固定偏移如拖拽,可以放在外面
 * 但事实上位移参与累积.
 */

export type ForceDir = {
  /**速度 */
  v: number
  /**位移 */
  d: number
  /**固定位置 */
  f?: number
}
export type ForceNode<T> = {
  index: number
  x: ForceDir
  y: ForceDir
  z: ForceDir
  value: T
}

export type Direction = "x" | "y" | "z"
function cloneDir(d: ForceDir) {
  return {
    ...d
  }
}

/**
 * 已经计算后的结果
 */
export type ForceLink<V, T> = {
  source: ForceNode<T>
  target: ForceNode<T>
  value: V
}
var initialRadius = 10,
  initialAngleRoll = Math.PI * (3 - Math.sqrt(5)), // Golden ratio angle
  initialAngleYaw = Math.PI * 20 / (9 + Math.sqrt(221)); // Markov irrational number


const emptyDir: ForceDir = {
  d: 0,
  v: 0
}

export function initToNode<T>(node: T, nDim: DIMType, i: number): ForceNode<T> {
  var radius = initialRadius * (nDim > 2 ? Math.cbrt(0.5 + i) : (nDim > 1 ? Math.sqrt(0.5 + i) : i)),
    rollAngle = i * initialAngleRoll,
    yawAngle = i * initialAngleYaw;
  if (nDim == 1) {
    return {
      index: i,
      value: node,
      x: {
        d: radius,
        v: 0
      },
      y: emptyDir,
      z: emptyDir
    }
  } else if (nDim == 2) {
    return {
      index: i,
      value: node,
      x: {
        d: radius * Math.cos(rollAngle),
        v: 0
      },
      y: {
        d: radius * Math.sin(rollAngle),
        v: 0
      },
      z: emptyDir
    }
  } else if (nDim == 3) {
    return {
      index: i,
      value: node,
      x: {
        d: radius * Math.sin(rollAngle) * Math.cos(yawAngle),
        v: 0
      },
      y: {
        d: radius * Math.cos(rollAngle),
        v: 0
      },
      z: {
        d: radius * Math.sin(rollAngle) * Math.sin(yawAngle),
        v: 0
      }
    }
  } else {
    throw new Error("尚不支持")
  }
}
export function initToForceNode<T>(nodes: T[], nDim: DIMType): ForceNode<T>[] {
  return nodes.map((node, i) => {
    return initToNode(node, nDim, i)
  })
}

function cloneNode<T>(node: ForceNode<T>, index: number): ForceNode<T> {
  return {
    index,
    x: cloneDir(node.x),
    y: cloneDir(node.y),
    z: cloneDir(node.z),
    value: node.value
  }
}

export type NodeForce<T, V> = (
  nodes: Readonly<ForceNode<T>>[],
  nDim: DIMType,
  links: ForceLink<V, T>[],
) => NodeForceFun<T, V>
export type NodeForceFun<T, V> = (alpha: number, nodes: ForceNode<T>[], links: ForceLink<V, T>[]) => void


export type BaseForceModel<T, V> = {
  //全局
  nDim: DIMType,
  //全局
  forces: Record<string, NodeForce<T, V>>
  nodes: ForceNode<T>[]
  links: ForceLink<V, T>[],

  //不影响
  alpha: number
  //不影响,拖拽
  alphaTarget: number
  //不影响
  alphaMin: number
  //不影响
  alphaDecay: number
  //不影响
  velocityDecay: number
}

export type ForceModel<T, V> = BaseForceModel<T, V> & {
  //tick时触发
  fs: NodeForceFun<T, V>[]
}


export function initForceModel<T, V>(
  nodes: ForceNode<T>[],
  links: ForceLink<V, T>[],
  forces: Record<string, NodeForce<T, V>>
): ForceModel<T, V> {
  const alphaMin = 0.001
  const nDim = 2
  const fs = Object.values(forces).map(f => f(nodes, nDim, links))
  return {
    nDim,
    alphaTarget: 0,
    alpha: 1,
    alphaMin,
    alphaDecay: 1 - Math.pow(alphaMin, 1 / 300),
    velocityDecay: 0.6,
    forces,
    nodes,
    links,
    fs
  }
}


export function updateForceConfig<T, V>(
  model: ForceModel<T, V>,
  config: Partial<BaseForceModel<T, V>>
) {
  const changeAll = config.nDim != model.nDim
    || config.nodes
    || config.links
    || config.forces

  model = {
    ...model,
    ...config
  }
  if (changeAll) {
    model.fs = Object.values(model.forces).map(f => f(model.nodes, model.nDim, model.links))
  }
  return model
}

export function tickForce<T, V>(
  model: ForceModel<T, V>,
  copy?: boolean
) {
  let { nodes, links, alphaDecay, alphaTarget, alpha, fs, nDim, velocityDecay } = model

  if (copy) {
    nodes = nodes.map(cloneNode)
    links = simpleCloneLinks(links, nodes)
  }
  // console.log("vs", nodes)
  alpha += (alphaTarget - alpha) * alphaDecay;
  fs.forEach((force) => {
    force(alpha, nodes, links);
  });
  function addD(v: ForceDir) {
    if (typeof v.f == 'number') {
      v.v = 0
      v.d = v.f
      return
    }
    v.v = v.v * velocityDecay
    v.d = v.d + v.v
  }
  function joinNode(node: ForceNode<any>) {
    addD(node.x)
    if (nDim > 1) {
      addD(node.y)
    }
    if (nDim > 2) {
      addD(node.z)
    }
  }
  nodes.forEach(joinNode)
  if (copy) {
    return {
      ...model,
      nodes,
      links,
      alpha
    }
  }
  model.alpha = alpha
  return model
}

export function simpleCloneLinks<T, V>(links: ForceLink<V, T>[], nodes: ForceNode<T>[]) {
  return links.map<ForceLink<V, T>>(link => {
    return {
      ...link,
      source: nodes[link.source.index],
      target: nodes[link.target.index]
    }
  })
}






export function findNode(
  nodes: ForceNode<any>[],
  radius = Infinity,
  x = 0,
  y = 0,
  z = 0,
) {
  var i = 0,
    n = nodes.length,
    dx,
    dy,
    dz,
    d2,
    node,
    closest;

  radius *= radius;

  for (i = 0; i < n; ++i) {
    node = nodes[i];
    dx = x - node.x.d;
    dy = y - (node.y.d || 0);
    dz = z - (node.z.d || 0);
    d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < radius) closest = node, radius = d2;
  }
  return closest;
}