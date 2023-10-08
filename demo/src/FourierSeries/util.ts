/**
 * 返回数字的二进制表示中使用的位数
 */
export function bitLength(number: number) {
  let bitsCounter = 0;

  while ((1 << bitsCounter) <= number) {
    bitsCounter += 1;
  }

  return bitsCounter;
}
