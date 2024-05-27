import { EaseFn } from "wy-helper";

export interface SpringOptions {
  /**弹性系数 k */
  stiffness: number;
  /** 阻尼系数 d */
  damping: number;
  /** 质量 m */
  mass: number;
  /**起始位置 */
  from: number;
  /**目标位置 */
  to: number;
  /**初始速度 v0 (可选) */
  initialVelocity?: number;
}
/**
 * 从chat-gpt来
 * 这个公式倒是跟reanimated里一样,但reanimated里有更多如配置时间
 *  reanimated没有过阻尼计算
 *  其速度依赖上一步
 * 与frame-motion里的有一处不同
 *  但frame-motion里的过阻尼计算太复杂,不如jc
 * 与jc里也不同
 * chat-gpt也给了更多
 * 
 * 看起来jetpack compose的实现得最好
 *  速度也不依赖上一步
 * use-spring是使用的采样法的动画...
 * @param options 
 */
export function springMotion({
  stiffness, damping, mass, from, to, initialVelocity = 0
}: SpringOptions): EaseFn {
  /**距离 */
  const deltaX = to - from;
  /**自由振荡角频率 */
  const omega0 = Math.sqrt(stiffness / mass);
  /**阻尼比 */
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  /**
   * 传入时间间隔,单位:s
   */
  if (zeta < 1) {
    /**阻尼振荡角频率 */
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    return function (elapsedTime) {
      const sinCoff = (initialVelocity + zeta * omega0 * deltaX) / omegaD
      const underDampedEnvelope = Math.exp(-zeta * omega0 * elapsedTime)
      return to - (
        underDampedEnvelope *
        (sinCoff * Math.sin(omegaD * elapsedTime)
          + deltaX * Math.cos(omegaD * elapsedTime))
      );
    }
  } else if (zeta == 1) {
    return function (elapsedTime) {
      return to - (
        Math.exp(-omega0 * elapsedTime) *
        (deltaX + (initialVelocity + omega0 * deltaX) * elapsedTime)
      )
    }
  } else {
    return function (elapsedTime) {

      // Overdamped spring
      const dampedAngularFreq =
        omega0 * Math.sqrt(zeta * zeta - 1)

      const envelope = Math.exp(-zeta * omega0 * elapsedTime)

      // When performing sinh or cosh letues can hit Infinity so we cap them here
      const freqForT = Math.min(dampedAngularFreq * elapsedTime, 300)

      return (
        to -
        (envelope *
          ((initialVelocity +
            zeta * omega0 * deltaX) *
            Math.sinh(freqForT) +
            dampedAngularFreq *
            deltaX *
            Math.cosh(freqForT))) /
        dampedAngularFreq
      )
    }
  }
}

export function springBase({
  zta,
  omega0,
  deltaX,
  initialVelocity,
  velocityWhenZta1Plus
}: {
  /**自由振荡角频率 */
  omega0: number
  /**阻尼比:0~1~无穷,0~1是欠阻尼,即会来回,1~无穷不会来回*/
  zta: number
  /**起始位置 */
  deltaX: number
  /**初始速度 v0 (可选) */
  initialVelocity: number;
  velocityWhenZta1Plus?: boolean
}) {
  // value = to - displacement
  if (zta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zta * zta)
    const cosCoeff = deltaX
    // Underdamped
    const sinCoeff = (initialVelocity + (zta * omega0 * deltaX)) / omegaD
    return function (elapsedTime: number) {
      const cos1 = Math.cos(omegaD * elapsedTime)
      const sin1 = Math.sin(omegaD * elapsedTime)

      const underDampedEnvelope = Math.exp(-zta * omega0 * elapsedTime)

      const displacement = underDampedEnvelope * (cosCoeff * cos1 + sinCoeff * sin1)
      return {
        //FM,Gpt,Jc,ReA
        displacement,
        //Jc,Rea依赖上一步,没有对上,Gpt,FM没有提供
        velocity: displacement * (-omega0) * zta
          + underDampedEnvelope * omegaD * (sinCoeff * cos1 - cosCoeff * sin1)
      }
    }
  } else if (zta == 1) {
    // Critically damped,
    const coeffA = deltaX
    const coeffB = initialVelocity + omega0 * deltaX
    return function (elapsedTime: number) {
      const criticallyDampedEnvelope = Math.exp(-omega0 * elapsedTime)
      return {
        //==FM,Gpt,Jc,ReA
        displacement: (coeffA + coeffB * elapsedTime) * criticallyDampedEnvelope,
        //Jc,Rea没有对止,Gpt,FM没有提供
        velocity: velocityWhenZta1Plus
          ? criticallyDampedEnvelope * (
            (coeffA + coeffB * elapsedTime) * (-omega0) + coeffB
          ) : 0
      }
    }
  } else {
    const cext = omega0 * Math.sqrt(zta * zta - 1)
    const gammaPlus = (-zta * omega0 + cext)
    const gammaMinus = (-zta * omega0 - cext)
    // Overdamped
    const coeffA = deltaX - (gammaMinus * deltaX - initialVelocity) / (gammaMinus - gammaPlus)

    const coeffB = (gammaMinus * deltaX - initialVelocity) / (gammaMinus - gammaPlus)

    return function (elapsedTime: number) {
      return {
        //Jc
        displacement: coeffA * Math.exp(gammaMinus * elapsedTime) +
          coeffB * Math.exp(gammaPlus * elapsedTime),
        //Jc
        velocity: velocityWhenZta1Plus
          ? coeffA * gammaMinus * Math.exp(gammaMinus * elapsedTime) + coeffB * gammaPlus * Math.exp(gammaPlus * elapsedTime)
          : 0
      }
    }
  }
}

export function getZtaAndOmega0From(
  /**弹性系数 k */
  stiffness: number,
  /** 阻尼系数 d */
  damping: number,
  /** 质量 m */
  mass: number
) {
  return {
    /**自由振荡角频率 */
    omega0: Math.sqrt(stiffness / mass),
    /**阻尼比 */
    zta: damping / (2 * Math.sqrt(stiffness * mass))
  }
}
/**
 * 按理说应该用能量剩余来计算
 * JC使用了较复杂的牛顿法去预估时间.
 * 其实只有欠阻尼需要评估速度
 * @param n 
 * @param displacementThreshold FM中是0.5,RNA中是0.01
 * @param velocityThreshold FM中是10,RNA中是2
 */
export function springIsStop(n: {
  displacement: number
  velocity: number
}, displacementThreshold = 0.01, velocityThreshold = 2) {
  return Math.abs(n.displacement) < displacementThreshold && Math.abs(n.velocity) < velocityThreshold
}