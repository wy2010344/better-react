
/**
 * https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/math/complex-number/ComplexNumber.js
 * 复数z=a + bi
 * 根据https://zh.wikipedia.org/wiki/%E5%A4%8D%E6%95%B0_(%E6%95%B0%E5%AD%A6)
 * 可转化成极坐标形式 z=r(cosk+isink),
 * 根据欧拉公式,即z=re^ik   ===>指数形式
 * 
 * 
 */
export default class ComplexNumber {
  constructor(
    //实部
    public readonly re = 0,
    //虚部
    public readonly im = 0
  ) { }
  /**
   * 模、幅值
   */
  radius() {
    return Math.sqrt(this.re ** 2 + this.im ** 2)
  }
  /**
   * 弧度角
   */
  parse() {
    return getParse(this.re, this.im)
  }

  add(n: ComplexNumber) {
    return new ComplexNumber(
      this.re + n.re,
      this.im + n.im
    )
  }
  sub(n: ComplexNumber) {
    return new ComplexNumber(
      this.re - n.re,
      this.im - n.im
    )
  }

  //乘法
  mul(n: ComplexNumber) {
    return new ComplexNumber(
      this.re * n.re - this.im * n.im,
      this.re * n.im + this.im * n.re
    )
  }

  /**
   * 除法,通过分子分母同乘以被除数的共轭,分母变成实数,再
   * @param n 
   * @returns 
   */
  div(n: ComplexNumber) {
    //a-bi
    const conj_n = n.conj()
    //(x+yi) * (a-bi)
    const finalDivident = this.mul(conj_n)

    const finalDivider = n.re ** 2 + n.im ** 2

    //(a+bi) * (a-bi)=a^2 + b^2
    return new ComplexNumber(
      finalDivident.re / finalDivider,
      finalDivident.im / finalDivider
    )
  }

  /**
   * 共轭,实部相同,虚部相反
   * @param n 
   */
  conj() {
    return new ComplexNumber(
      this.re,
      -this.im
    )
  }
}

/**
 * 弧度转度数
 * @param n 
 */
export function radianToDegree(n: number) {
  return n * 180 / Math.PI
}

function getParse(re: number, im: number) {
  // return 180 * Math.atan2(im, re) / Math.PI
  if (re > 0) {
    return Math.atan(Math.abs(im) / Math.abs(re))
  } else if (re == 0) {
    if (im > 0) {
      return Math.PI / 2
    } else if (im < 0) {
      return -Math.PI / 2
    } else {
      //本来是没有定义、绝对的0
      return 0
    }
  } else {
    const parse = Math.atan(Math.abs(im) / Math.abs(re))
    if (im >= 0) {
      return parse + Math.PI
    } else {
      return parse - Math.PI
    }
  }
}