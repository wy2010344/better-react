/**
 * 欠阻尼弹簧计算
 * @param animation 
 * @param precalculatedValues 
 * @returns 
 */
export function underDampedSpringCalculations(
  animation: InnerSpringAnimation,
  precalculatedValues: {
    zeta: number;
    v0: number;
    x0: number;
    omega0: number;
    omega1: number;
    t: number;
  }
): { position: number; velocity: number } {
  'worklet';
  const { toValue, current, velocity } = animation;

  const { zeta, t, omega0, omega1 } = precalculatedValues;

  const v0 = -velocity;
  const x0 = toValue - current;

  const sin1 = Math.sin(omega1 * t);
  const cos1 = Math.cos(omega1 * t);

  // under damped
  const underDampedEnvelope = Math.exp(-zeta * omega0 * t);
  const underDampedFrag1 =
    underDampedEnvelope *
    (sin1 * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cos1);

  const underDampedPosition = toValue - underDampedFrag1;
  // This looks crazy -- it's actually just the derivative of the oscillation function
  const underDampedVelocity =
    zeta * omega0 * underDampedFrag1 -
    underDampedEnvelope *
    (cos1 * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin1);

  return { position: underDampedPosition, velocity: underDampedVelocity };
}


/**
 * 临界阻尼计算
 * @param animation 
 * @param precalculatedValues 
 * @returns 
 */
export function criticallyDampedSpringCalculations(
  animation: InnerSpringAnimation,
  precalculatedValues: {
    v0: number;
    x0: number;
    omega0: number;
    t: number;
  }
): { position: number; velocity: number } {
  'worklet';
  const { toValue } = animation;

  const { v0, x0, omega0, t } = precalculatedValues;

  const criticallyDampedEnvelope = Math.exp(-omega0 * t);
  const criticallyDampedPosition =
    toValue - criticallyDampedEnvelope * (x0 + (v0 + omega0 * x0) * t);

  const criticallyDampedVelocity =
    criticallyDampedEnvelope *
    (v0 * (t * omega0 - 1) + t * x0 * omega0 * omega0);

  return {
    position: criticallyDampedPosition,
    velocity: criticallyDampedVelocity,
  };
}

/**
 * 动画终止计算
 * @param animation 
 * @param config 
 * @returns 
 */
export function isAnimationTerminatingCalculation(
  animation: InnerSpringAnimation,
  config: DefaultSpringConfig
): {
  isOvershooting: boolean;
  isVelocity: boolean;
  isDisplacement: boolean;
} {
  'worklet';
  const { toValue, velocity, startValue, current } = animation;

  const isOvershooting = config.overshootClamping
    ? (current > toValue && startValue < toValue) ||
    (current < toValue && startValue > toValue)
    : false;

  const isVelocity = Math.abs(velocity) < config.restSpeedThreshold;
  const isDisplacement =
    Math.abs(toValue - current) < config.restDisplacementThreshold;

  return { isOvershooting, isVelocity, isDisplacement };
}


export type DefaultSpringConfig = {
  /**
   * 弹簧是否可以在“toValue”上方弹跳。 默认为 false。
   */
  overshootClamping: number
  /**
   * 弹簧将捕捉到 toValue 且不再进一步振荡的速度（以像素/秒为单位）。 默认为 2。
   */
  restSpeedThreshold: number
  /**
   * 低于该位移弹簧将捕捉到 toValue 而不会进一步振荡。 默认为 0.01。
   */
  restDisplacementThreshold: number


  /**
   * 时间模式
   */
  useDuration: boolean
  duration: number

  /**
   * 弹簧的重量。 减少该值会使动画速度更快。 默认为 1。
   */
  mass: number
  /**
   * 应用于弹簧方程的初始速度。 默认为 0。
   */
  velocity: number


  /**
   * 弹性,默认100
   */
  stiffness: number
  /**
   * 弹簧的阻尼有多大。 值 1 表示弹簧临界阻尼，值 \>1 表示弹簧过阻尼。 默认为 0.5。
   */
  dampingRatio: number
  /**
   * 弹簧减速的速度有多快。 较高的阻尼意味着弹簧会更快地静止。 默认为 10。
   */
  damping: number

  clamp: { min?: number; max?: number }
}

export interface InnerSpringAnimation {
  toValue: number;
  current: number;
  velocity: number,
  startValue: number


  startTimestamp: number
  lastTimestamp: number
  zeta: number;
  omega0: number;
  omega1: number;


  duration: number
  dampingRatio: number
}





/**
 * 计算新质量匹配持续时间
 * @param x0 
 * @param config 
 * @param v0 
 * @returns 
 */
export function calculateNewMassToMatchDuration(
  x0: number,
  config: DefaultSpringConfig,
  v0: number
) {

  /** 使用以下公式：https://phys.libretexts.org/Bookshelves/University_Physics/Book%3A_University_Physics_(OpenStax)/Book%3A_University_Physics_I__-_Mechanics_Sound_Oscillations_and_Waves_(OpenStax)/15%3A_Oscillations/15.06%3A_Damped_Oscillations
        * 找到渐近线并估计阻尼，从而给出预期的持续时间

            ⎛ ⎛ c⎞           ⎞           
            ⎜-⎜──⎟ ⋅ duration⎟           
            ⎝ ⎝2m⎠           ⎠           
       A ⋅ e                   = threshold

 
     使用“能量守恒定律”计算振幅
                       _________________
                      ╱      2         2
                     ╱ m ⋅ v0  + k ⋅ x0 
      amplitude =   ╱  ─────────────────
                  ╲╱           k        
并用提供的阻尼比替换质量：m = (c^2)/(4 * k * zeta^2)
      */
  const {
    stiffness: k,
    dampingRatio: zeta,
    restSpeedThreshold: threshold,
    duration,
  } = config;

  const durationForMass = (mass: number) => {
    'worklet';
    const amplitude =
      (mass * v0 * v0 + k * x0 * x0) / (Math.exp(1 - 0.5 * zeta) * k);
    const c = zeta * 2 * Math.sqrt(k * mass);
    return (
      1000 * ((-2 * mass) / c) * Math.log((threshold * 0.01) / amplitude) -
      duration
    );
  };

  /**
   * 在我们的例子中，二分法比牛顿法快得多
   */
  return bisectRoot({ min: 0, max: 100, func: durationForMass });
}



// ts-prune-ignore-next This function is exported to be tested
export function bisectRoot({
  min,
  max,
  func,
  maxIterations = 20,
}: {
  min: number;
  max: number;
  func: (x: number) => number;
  maxIterations?: number;
}) {
  'worklet';
  const ACCURACY = 0.00005;
  let idx = maxIterations;
  let current = (max + min) / 2;
  while (Math.abs(func(current)) > ACCURACY && idx > 0) {
    idx -= 1;

    if (func(current) < 0) {
      min = current;
    } else {
      max = current;
    }
    current = (min + max) / 2;
  }
  return current;
}



export function initialCalculations(
  mass = 0,
  config: DefaultSpringConfig
): {
  zeta: number;
  omega0: number;
  omega1: number;
} {
  'worklet';
  if (config.useDuration) {
    const { stiffness: k, dampingRatio: zeta } = config;

    /** omega0 and omega1 denote angular frequency and natural angular frequency, see this link for formulas:
     *  https://courses.lumenlearning.com/suny-osuniversityphysics/chapter/15-5-damped-oscillations/
     */
    const omega0 = Math.sqrt(k / mass);
    const omega1 = omega0 * Math.sqrt(1 - zeta ** 2);

    return { zeta, omega0, omega1 };
  } else {
    const { damping: c, mass: m, stiffness: k } = config;

    const zeta = c / (2 * Math.sqrt(k * m)); // damping ratio
    const omega0 = Math.sqrt(k / m); // undamped angular frequency of the oscillator (rad/ms)
    const omega1 = omega0 * Math.sqrt(1 - zeta ** 2); // exponential decay

    return { zeta, omega0, omega1 };
  }
}