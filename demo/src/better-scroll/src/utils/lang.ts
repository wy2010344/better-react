export function getNow() {
  return window.performance &&
    window.performance.now as any &&
    window.performance.timing
    ? window.performance.now() + window.performance.timing.navigationStart
    : +new Date()
}


export function isUndef(v: any): boolean {
  return v === undefined || v === null
}