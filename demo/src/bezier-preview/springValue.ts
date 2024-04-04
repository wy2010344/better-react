import { DefaultSpringConfig, InnerSpringAnimation, calculateNewMassToMatchDuration, criticallyDampedSpringCalculations, initialCalculations, isAnimationTerminatingCalculation, underDampedSpringCalculations } from "./springUtil";



function defineAnimation(config: DefaultSpringConfig) {

  function springOnFrame(
    animation: InnerSpringAnimation,
    now: number
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const { toValue, startTimestamp, current } = animation;

    const timeFromStart = now - startTimestamp;

    if (config.useDuration && timeFromStart >= config.duration) {
      animation.current = toValue;
      // clear lastTimestamp to avoid using stale value by the next spring animation that starts after this one
      animation.lastTimestamp = 0;
      return true;
    }

    const { lastTimestamp, velocity } = animation;

    const deltaTime = Math.min(now - lastTimestamp, 64);
    animation.lastTimestamp = now;

    const t = deltaTime / 1000;
    const v0 = -velocity;
    const x0 = toValue - current;

    const { zeta, omega0, omega1 } = animation;

    const { position: newPosition, velocity: newVelocity } =
      zeta < 1
        ? underDampedSpringCalculations(animation, {
          zeta,
          v0,
          x0,
          omega0,
          omega1,
          t,
        })
        : criticallyDampedSpringCalculations(animation, {
          v0,
          x0,
          omega0,
          t,
        });

    animation.current = newPosition;
    animation.velocity = newVelocity;

    const { isOvershooting, isVelocity, isDisplacement } =
      isAnimationTerminatingCalculation(animation, config);

    const springIsNotInMove =
      isOvershooting || (isVelocity && isDisplacement);

    if (!config.useDuration && springIsNotInMove) {
      animation.velocity = 0;
      animation.current = toValue;
      // clear lastTimestamp to avoid using stale value by the next spring animation that starts after this one
      animation.lastTimestamp = 0;
      return true;
    }

    return false;
  }




  function isTriggeredTwice(
    previousAnimation: InnerSpringAnimation | undefined,
    animation: InnerSpringAnimation
  ) {
    return (
      previousAnimation?.lastTimestamp &&
      previousAnimation?.startTimestamp &&
      previousAnimation?.toValue === animation.toValue &&
      previousAnimation?.duration === animation.duration &&
      previousAnimation?.dampingRatio === animation.dampingRatio
    );
  }

  function onStart(
    animation: InnerSpringAnimation,
    value: number,
    now: number,
    previousAnimation: InnerSpringAnimation | undefined
  ): void {
    animation.current = value;
    animation.startValue = value;

    let mass = config.mass;
    const triggeredTwice = isTriggeredTwice(previousAnimation, animation);

    const duration = config.duration;

    const x0 = triggeredTwice
      ? // If animation is triggered twice we want to continue the previous animation
      // form the previous starting point
      previousAnimation?.startValue
      : Number(animation.toValue) - value;

    if (previousAnimation) {
      animation.velocity =
        (triggeredTwice
          ? previousAnimation?.velocity
          : previousAnimation?.velocity + config.velocity) || 0;
    } else {
      animation.velocity = config.velocity || 0;
    }

    if (triggeredTwice) {
      animation.zeta = previousAnimation?.zeta || 0;
      animation.omega0 = previousAnimation?.omega0 || 0;
      animation.omega1 = previousAnimation?.omega1 || 0;
    } else {
      if (config.useDuration) {
        const actualDuration = triggeredTwice
          ? // If animation is triggered twice we want to continue the previous animation
          // so we need to include the time that already elapsed
          duration -
          ((previousAnimation?.lastTimestamp || 0) -
            (previousAnimation?.startTimestamp || 0))
          : duration;

        config.duration = actualDuration;
        mass = calculateNewMassToMatchDuration(
          x0 as number,
          config,
          animation.velocity
        );
      }

      const { zeta, omega0, omega1 } = initialCalculations(mass, config);
      animation.zeta = zeta;
      animation.omega0 = omega0;
      animation.omega1 = omega1;

      if (config.clamp !== undefined) {
        animation.zeta = scaleZetaToMatchClamps(animation, config.clamp);
      }
    }

    animation.lastTimestamp = previousAnimation?.lastTimestamp || now;

    animation.startTimestamp = triggeredTwice
      ? previousAnimation?.startTimestamp || now
      : now;
  }

}




/** We make an assumption that we can manipulate zeta without changing duration of movement.
 *  According to theory this change is small and tests shows that we can indeed ignore it.
 */
export function scaleZetaToMatchClamps(
  animation: InnerSpringAnimation,
  clamp: { min?: number; max?: number }
): number {
  'worklet';
  const { zeta, toValue, startValue } = animation;
  const toValueNum = Number(toValue);

  if (toValueNum === startValue) {
    return zeta;
  }

  const [firstBound, secondBound] =
    toValueNum - startValue > 0
      ? [clamp.min, clamp.max]
      : [clamp.max, clamp.min];

  /** The extrema we get from equation below are relative (we obtain a ratio),
   *  To get absolute extrema we convert it as follows:
   *
   *  AbsoluteExtremum = startValue ± RelativeExtremum * (toValue - startValue)
   *  Where ± denotes:
   *    + if extremum is over the target
   *    - otherwise
   */

  const relativeExtremum1 =
    secondBound !== undefined
      ? Math.abs((secondBound - toValueNum) / (toValueNum - startValue))
      : undefined;

  const relativeExtremum2 =
    firstBound !== undefined
      ? Math.abs((firstBound - toValueNum) / (toValueNum - startValue))
      : undefined;

  /** Use this formula http://hyperphysics.phy-astr.gsu.edu/hbase/oscda.html to calculate
   *  first two extrema. These extrema are located where cos = +- 1
   *
   *  Therefore the first two extrema are:
   *
   *     Math.exp(-zeta * Math.PI);      (over the target)
   *     Math.exp(-zeta * 2 * Math.PI);  (before the target)
   */

  const newZeta1 =
    relativeExtremum1 !== undefined
      ? Math.abs(Math.log(relativeExtremum1) / Math.PI)
      : undefined;

  const newZeta2 =
    relativeExtremum2 !== undefined
      ? Math.abs(Math.log(relativeExtremum2) / (2 * Math.PI))
      : undefined;

  const zetaSatisfyingClamp = [newZeta1, newZeta2].filter(
    (x: number | undefined): x is number => x !== undefined
  );
  // The bigger is zeta the smaller are bounces, we return the biggest one
  // because it should satisfy all conditions
  return Math.max(...zetaSatisfyingClamp, zeta);
}