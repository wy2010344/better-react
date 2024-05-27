import { dom } from "better-react-dom";
import { useChange, useEffect, useMemo } from "better-react-helper";
import { emptyArray } from "wy-helper";
import { bezierCanvas, funCanvas } from "./animationLine";

export default function () {

  dom.div({
    style: `
    display:flex;
    align-items:center;
    justify-content:center;
    background:yellow;
    height:100%;
    `
  }).render(function () {
    renderCustomSpring()
  })
}


function superEnergy({
  velocity = 0,
  distance,
  mass,
  stiffness,
  friction
}: {
  //初始速度
  velocity?: number
  //初始位移
  distance: number
  //质量
  mass: number
  //刚度,弹性系数
  stiffness: number
  //摩擦力
  friction: number
}) {
  const initE = stiffness * distance * distance + mass * velocity * velocity
  const costTime = Math.sqrt(initE * mass) / friction
  console.log(costTime)
  const temp1 = initE / stiffness
  const temp2 = Math.pow(friction, 2) / mass / stiffness
  return {
    time: costTime,
    fn(t: number) {
      /**
       *distance * distance + (mass * velocity * velocity / stiffness) - Math.pow(friction * t, 2) / mass / stiffness
       */
      const diff = temp1 - temp2 * t * t
      if (diff <= 0) {
        return 1
      }
      return 1 - Math.sqrt(diff)
    }
  }
}

function energy({
  velocity = 0,
  distance = 1,
  stiffness
}: {
  //初始速度
  velocity?: number
  //初始位移
  distance?: number
  stiffness: number
}) {
  const friction = Math.sqrt(stiffness)
  return superEnergy({
    velocity,
    distance,
    stiffness,
    friction,
    mass: 1,
  })
}
function renderCustomSpring() {

  const value = useMemo(() => {
    const { fn, time } = energy({
      stiffness: 1,
      // velocity: 0.3,
      // distance: 0.8
    })
    return function (t: number) {
      return fn(t) //* Math.sin(Math.PI * 9 * t * t / 2)
    }
  })
  funCanvas(function () {

  }, a1)
}

//这是最终的简化函数
function quard(t: number) {
  return 1 - Math.sqrt(1 - t * t)
}


function getDiffTime(
  distance: number,
  velocity: number,
  stiffness: number
) {
  const diffE = (1 - distance * distance) - velocity * velocity / stiffness
  return (diffE < 0 ? -1 : 1) * Math.sqrt(Math.abs(diffE))
}

function animateValue({
  duration,
  velocity = 0,
  from,
  flagFrom,
  to,
  stiffness
}: {
  //花费时间
  duration: number
  //实时触发的速度
  velocity?: number
  //实时触发的初始位置
  from: number
  //标准的初始位置
  flagFrom: number
  //目标
  to: number
  stiffness: number
}) {
  const total = to - flagFrom
  const diffTime = getDiffTime(from - to / total, velocity / total, stiffness)
  console.log("diff", diffTime)
  return function (t: number) {
    const pt = t / duration + diffTime
    const v = quard(pt) * Math.sin(Math.PI * 9 * pt * pt / 2)
    console.log("dv", v)
    return v * total + flagFrom
  }
}


const a1 = animateValue({
  duration: 1,
  from: 1.2,
  flagFrom: 1,
  to: 0,
  stiffness: 5
})