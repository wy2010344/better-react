import ComplexNumber from './ComplexNumber';
import { bitLength } from './util';

/**
 * 参考
 * https://github.com/trekhleb /javascript-algorithms/blob/master/src/algorithms/math/fourier-transform/fastFourierTransform.js
 */
/**
 * Returns the number which is the flipped binary representation of input.
 *返回输入的翻转二进制表示形式的数字。
 */
function reverseBits(input: number, bitsCount: number) {
  let reversedBits = 0;

  for (let bitIndex = 0; bitIndex < bitsCount; bitIndex += 1) {
    reversedBits *= 2;

    if (Math.floor(input / (1 << bitIndex)) % 2 === 1) {
      reversedBits += 1;
    }
  }

  return reversedBits;
}

/**
 * Returns the radix-2 fast fourier transform of the given array.
 * Optionally computes the radix-2 inverse fast fourier transform.
 */
export default function fastFourierTransform(inputData: ComplexNumber[], inverse: boolean = false): ComplexNumber[] {
  const bitsCount = bitLength(inputData.length - 1);
  const N = 1 << bitsCount;

  while (inputData.length < N) {
    inputData.push(new ComplexNumber());
  }

  const output: ComplexNumber[] = [];
  for (let dataSampleIndex = 0; dataSampleIndex < N; dataSampleIndex += 1) {
    output[dataSampleIndex] = inputData[reverseBits(dataSampleIndex, bitsCount)];
  }

  for (let blockLength = 2; blockLength <= N; blockLength *= 2) {
    const imaginarySign = inverse ? -1 : 1;
    const phaseStep = new ComplexNumber(
      Math.cos((2 * Math.PI) / blockLength),
      imaginarySign * Math.sin((2 * Math.PI) / blockLength),
    );

    for (let blockStart = 0; blockStart < N; blockStart += blockLength) {
      let phase = new ComplexNumber(1);

      for (let signalId = blockStart; signalId < (blockStart + blockLength / 2); signalId += 1) {
        const component = output[signalId + blockLength / 2].mul(phase);

        const upd1 = output[signalId].add(component);
        const upd2 = output[signalId].sub(component);

        output[signalId] = upd1;
        output[signalId + blockLength / 2] = upd2;

        phase = phase.mul(phaseStep);
      }
    }
  }

  if (inverse) {
    for (let signalId = 0; signalId < N; signalId += 1) {
      output[signalId] = output[signalId].div(new ComplexNumber(N));
    }
  }

  return output;
}





/**
 * 参考的fft-js 这里可为-2*pi*k/N,也可没有负,只是计算出来的结果不同
 * @param vector 
 * @returns 
 */
export function fft2(vector: ComplexNumber[]): ComplexNumber[] {
  var X = [],
    N = vector.length;

  // Base case is X = x + 0i since our input is assumed to be real only.
  if (N < 2) {
    return vector
  }

  // Recurse: all even samples
  var X_evens = fft2(vector.filter(even)),

    // Recurse: all odd samples
    X_odds = fft2(vector.filter(odd));

  // Now, perform N/2 operations!
  for (var k = 0; k < N / 2; k++) {
    // t is a complex number!
    const vnk = exponent(k, N)
    var t = X_evens[k],
      e = vnk.mul(X_odds[k] || Zero);

    X[k] = e.add(t || Zero)
    X[k + (N / 2)] = (t || Zero).sub(e)
  }
  return X;
}
const Zero = new ComplexNumber(0)
function even(__: any, ix: number) {
  return ix % 2 == 0;
}

function odd(__: any, ix: number) {
  return ix % 2 == 1;
}

const mapExponent = {} as any
function exponent(k: number, N: number) {
  var x = 2 * Math.PI * (k / N);
  // mapExponent[N] = mapExponent[N] || {};
  // mapExponent[N][k] = mapExponent[N][k] || [Math.cos(x), Math.sin(x)];// [Real, Imaginary]
  // const rv = mapExponent[N][k];
  // return new ComplexNumber(rv[0], rv[1])
  return new ComplexNumber(Math.cos(x), Math.sin(x))
};

/**
 * 实部与虚部互换
 * fft2后,再进行实部与虚部的互换
 * @param input 
 * @returns 
 */
export function ifft2(input: ComplexNumber[]) {
  input = input.map(v => new ComplexNumber(v.im, v.re))
  const N = input.length
  const outs = fft2(input)
  return outs.map(out => {
    return new ComplexNumber(out.im / N, out.re / N)
  })
}

/**
 * chat-gpt出来的
 * 但是是不对称的,需要用下面的ifft3才能正常的反转出来
 * @param input 
 * @param reverse 
 * @returns 
 */
export function fft3(input: ComplexNumber[], reverse?: boolean): ComplexNumber[] {
  const N = input.length;
  if (N <= 1) return input;

  // 分离奇偶项
  const even: ComplexNumber[] = [];
  const odd: ComplexNumber[] = [];
  for (let i = 0; i < N; i += 2) {
    even.push(input[i]);
    odd.push(input[i + 1]);
  }

  // 递归计算傅立叶变换
  const evenTransformed = fft3(even, reverse);
  const oddTransformed = fft3(odd, reverse);

  // 合并变换后的结果
  const output = new Array(N);
  for (let i = 0; i < N / 2; i++) {
    const angle = 2 * Math.PI * i / N;
    const t = reverse
      ? new ComplexNumber(Math.cos(-angle) / N, Math.sign(-angle) / N)
      : new ComplexNumber(Math.cos(angle), Math.sin(angle))
    const term = t.mul(oddTransformed[i])
    output[i] = evenTransformed[i].add(term)
    output[i + N / 2] = evenTransformed[i].sub(term);
  }

  return output;
}
/**先获得所有元素的共轭,再计算fft,完成后再计算所有元素的共轭,并都除以长度 */
export function ifft3(input: ComplexNumber[]) {
  input = input.map(v => new ComplexNumber(v.re, - v.im))
  const N = input.length
  const outs = fft3(input)
  return outs.map(out => {
    return new ComplexNumber(out.re / N, -out.im / N)
  })
}