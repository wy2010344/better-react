import { dispatch } from "d3-dispatch";
import { timer } from "d3-timer";
import lcg from "./lcg";
import { EmptyFun, GetValue } from "wy-helper";
import { Node } from './model'


/**
 * 参考
 * https://github.com/vasturiano/d3-force-3d/blob/master/src/simulation.js
 * https://github.com/d3/d3-force/blob/main/src/simulation.js
 * 
 * 特点:由于是时间驱动,时间影响下元素的3个维度的坐标点都会改变
 * 1.所有属性都可以动态变更,在下一个时间周期生效或立即生效,类似属性在useEffect里面
 *   但事实上有重复,最好批量更新,只执行一次
 * 2.靠render去更新属性?靠观察去更新属性
 * 3.需要去元素解耦,坐标系统与具体值.
 *  坐标系统是布局生成的,要通过注册或key映射去获得.
 *  通过注册获得:生成唯一id,像传统布局,在不同的levelEffect里面.
 *  元素的位置信息通过回调传递回来,再通知渲染,还是直接绑定到元素的属性上触发渲染?
 *    如果是布局,则会一次性计算.
 *    如果是动画,应该在reducer里触发走一遍,
 *    reducer就可能布局属性和业务属性聚合在一起.其实就需要泛型的get/set方法映射.
 * 
 * 
 * 这个组件化也跟react式的组件类似,每个有自己的初始化(或销毁),然后每一个都享有更新
 *  而且都能访问父作用域的context.
 *  而且最好不要累积,而是需要的时候实时计算,最多可以memo
 * 
 * 虽然reduce模式,但最好不要有显式的布局参数....
 */

var MAX_DIMENSIONS = 3;

export function x(d: Node) {
  return d.x;
}

export function y(d: Node) {
  return d.y;
}

export function z(d: Node) {
  return d.z;
}


export type Force = {
  initialize?(nodes: Node[], random: () => number, nDim: number): void
  (n: number): void
}
var initialRadius = 10,
  initialAngleRoll = Math.PI * (3 - Math.sqrt(5)), // Golden ratio angle
  initialAngleYaw = Math.PI * 20 / (9 + Math.sqrt(221)); // Markov irrational number

export default function (
  nodes: Node[] = [],
  numDimensions = 2) {
  var nDim = Math.min(MAX_DIMENSIONS, Math.max(1, Math.round(numDimensions))),
    simulation: any,
    alpha = 1,
    alphaMin = 0.001,
    alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
    alphaTarget = 0,
    velocityDecay = 0.6,
    forces = new Map<string, Force>(),
    stepper = timer(step),
    event = dispatch("tick", "end"),
    random = lcg();
  function step() {
    tick();
    event.call("tick", simulation);
    if (alpha < alphaMin) {
      stepper.stop();
      event.call("end", simulation);
    }
  }

  function tick(iterations = 1) {
    var i, n = nodes.length, node;
    for (var k = 0; k < iterations; ++k) {
      alpha += (alphaTarget - alpha) * alphaDecay;

      forces.forEach(function (force) {
        force(alpha);
      });

      for (i = 0; i < n; ++i) {
        node = nodes[i];
        if (node.fx == null)
          node.x += node.vx *= velocityDecay;
        else node.x = node.fx, node.vx = 0;
        if (nDim > 1) {
          if (node.fy == null)
            node.y += node.vy *= velocityDecay;
          else node.y = node.fy, node.vy = 0;
        }
        if (nDim > 2) {
          if (node.fz == null)
            node.z += node.vz *= velocityDecay;
          else node.z = node.fz, node.vz = 0;
        }
      }
    }

    return simulation;
  }

  function initializeNodes() {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.index = i;
      if (node.fx != null) node.x = node.fx;
      if (node.fy != null) node.y = node.fy;
      if (node.fz != null) node.z = node.fz;
      if (isNaN(node.x) || (nDim > 1 && isNaN(node.y)) || (nDim > 2 && isNaN(node.z))) {
        var radius = initialRadius * (nDim > 2 ? Math.cbrt(0.5 + i) : (nDim > 1 ? Math.sqrt(0.5 + i) : i)),
          rollAngle = i * initialAngleRoll,
          yawAngle = i * initialAngleYaw;

        if (nDim === 1) {
          node.x = radius;
        } else if (nDim === 2) {
          node.x = radius * Math.cos(rollAngle);
          node.y = radius * Math.sin(rollAngle);
        } else { // 3 dimensions: use spherical distribution along 2 irrational number angles
          node.x = radius * Math.sin(rollAngle) * Math.cos(yawAngle);
          node.y = radius * Math.cos(rollAngle);
          node.z = radius * Math.sin(rollAngle) * Math.sin(yawAngle);
        }
      }
      if (isNaN(node.vx) || (nDim > 1 && isNaN(node.vy)) || (nDim > 2 && isNaN(node.vz))) {
        node.vx = 0;
        if (nDim > 1) { node.vy = 0; }
        if (nDim > 2) { node.vz = 0; }
      }
    }
  }

  function initializeForce(force: Force) {
    if (force.initialize) force.initialize(nodes, random, nDim);
    return force;
  }

  initializeNodes();

  return simulation = {
    tick: tick,

    restart() {
      return stepper.restart(step), simulation;
    },

    stop() {
      return stepper.stop(), simulation;
    },

    numDimensions(_?: number) {
      return arguments.length
        ? (nDim = Math.min(MAX_DIMENSIONS, Math.max(1, Math.round(_!))),
          forces.forEach(initializeForce),
          simulation)
        : nDim;
    },

    nodes(_?: Node[]) {
      return arguments.length
        ? (nodes = _!, initializeNodes(),
          forces.forEach(initializeForce),
          simulation)
        : nodes;
    },

    alpha(_?: number) {
      return arguments.length
        ? (alpha = +_!, simulation)
        : alpha;
    },

    alphaMin(_?: number) {
      return arguments.length
        ? (alphaMin = +_!, simulation)
        : alphaMin;
    },

    alphaDecay(_?: number) {
      return arguments.length
        ? (alphaDecay = +_!, simulation)
        : +alphaDecay;
    },

    alphaTarget(_?: number) {
      return arguments.length
        ? (alphaTarget = +_!, simulation)
        : alphaTarget;
    },

    /**
     * 速度衰减
     * @param _ 
     * @returns 
     */
    velocityDecay(_?: number) {
      return arguments.length
        ? (velocityDecay = 1 - _!, simulation)
        : 1 - velocityDecay;
    },

    randomSource(_?: GetValue<number>) {
      return arguments.length
        ? (random = _!,
          forces.forEach(initializeForce),
          simulation)
        : random;
    },

    force(name: string, _?: Force) {
      return arguments.length > 1
        ? ((_ == null ? forces.delete(name) : forces.set(name, initializeForce(_))), simulation)
        : forces.get(name);
    },

    find() {
      var args = Array.prototype.slice.call(arguments);
      var x = args.shift() || 0,
        y = (nDim > 1 ? args.shift() : null) || 0,
        z = (nDim > 2 ? args.shift() : null) || 0,
        radius = args.shift() || Infinity;

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
        dx = x - node.x;
        dy = y - (node.y || 0);
        dz = z - (node.z || 0);
        d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < radius) closest = node, radius = d2;
      }

      return closest;
    },

    on(name: string, _?: EmptyFun) {
      return arguments.length > 1
        ? (event.on(name, _!), simulation)
        : event.on(name);
    }
  };
}