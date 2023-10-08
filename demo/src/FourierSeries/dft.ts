import ComplexNumber from "./ComplexNumber";

const CLOSE_TO_ZERO_THRESHOLD = 1e-10;

/**
 * Discrete Fourier Transform (DFT): time to frequencies.
 *
 * Time complexity: O(N^2)
 *
 * @param {number[]} inputAmplitudes - Input signal amplitudes over time (complex
 * numbers with real parts only).
 * @param {number} zeroThreshold - Threshold that is used to convert real and imaginary numbers
 * to zero in case if they are smaller then this.
 *
 * @return {ComplexNumber[]} - Array of complex number. Each of the number represents the frequency
 * or signal. All signals together will form input signal over discrete time periods. Each signal's
 * complex number has radius (amplitude) and phase (angle) in polar form that describes the signal.
 *
 * @see https://gist.github.com/anonymous/129d477ddb1c8025c9ac
 * @see https://betterexplained.com/articles/an-interactive-guide-to-the-fourier-transform/
 */
export default function dft(inputAmplitudes: ComplexNumber[], zeroThreshold: number = CLOSE_TO_ZERO_THRESHOLD): ComplexNumber[] {
  const N = inputAmplitudes.length;
  const signals = [];

  // Go through every discrete frequency.
  for (let frequency = 0; frequency < N; frequency += 1) {
    // Compound signal at current frequency that will ultimately
    // take part in forming input amplitudes.
    let frequencySignal = new ComplexNumber();

    // Go through every discrete point in time.
    for (let timer = 0; timer < N; timer += 1) {
      const currentAmplitude = inputAmplitudes[timer];

      // Calculate rotation angle.
      const rotationAngle = -(2 * Math.PI) * frequency * (timer / N);

      // Remember that e^ix = cos(x) + i * sin(x);
      const dataPointContribution = new ComplexNumber(
        Math.cos(rotationAngle),
        Math.sin(rotationAngle),
      ).mul(currentAmplitude);

      // Add this data point's contribution.
      frequencySignal = frequencySignal.add(dataPointContribution);
    }

    // Close to zero? You're zero.
    if (Math.abs(frequencySignal.re) < zeroThreshold) {
      frequencySignal = new ComplexNumber(0, frequencySignal.im)
    }

    if (Math.abs(frequencySignal.im) < zeroThreshold) {
      frequencySignal = new ComplexNumber(frequencySignal.re, 0);
    }

    // Average contribution at this frequency.
    // The 1/N factor is usually moved to the reverse transform (going from frequencies
    // back to time). This is allowed, though it would be nice to have 1/N in the forward
    // transform since it gives the actual sizes for the time spikes.
    // frequencySignal = new ComplexNumber(frequencySignal.re / N, frequencySignal.im / N);
    frequencySignal = frequencySignal.div(new ComplexNumber(N));

    // Add current frequency signal to the list of compound signals.
    signals[frequency] = frequencySignal;
  }

  return signals;
}



export function dft2(x: ComplexNumber[]) {
  const X: ComplexNumber[] = [];
  const N = x.length;
  for (let k = 0; k < N; k++) {
    let sum = new ComplexNumber(0, 0);
    for (let n = 0; n < N; n++) {
      const phi = (Math.PI * 2 * k * n) / N;
      const c = new ComplexNumber(Math.cos(phi), -Math.sin(phi));
      sum = sum.add(x[n].mul(c));
    }
    sum = new ComplexNumber(sum.re / N, sum.im / N)
    // let freq = k;
    // let radius = Math.sqrt(sum.re * sum.re + sum.im * sum.im);
    // let parse = Math.atan2(sum.im, sum.re);
    X[k] = sum;
  }
  return X;

}