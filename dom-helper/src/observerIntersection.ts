
export function observerIntersection(
  callback: IntersectionObserverCallback,
  flag: Element,
  options?: IntersectionObserverInit
) {
  const observer = new IntersectionObserver(callback, options)
  observer.observe(flag)
  return function () {
    observer.unobserve(flag)
    observer.disconnect()
  }
}
