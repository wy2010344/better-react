export function delay(n: number) {
  return new Promise(resolve => {
    setTimeout(resolve, n)
  })
}

export function delayAnimationFrame() {
  return new Promise(resolve => {
    requestAnimationFrame(resolve)
  })
}