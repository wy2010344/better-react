
const mb = {
  DOM: {
    addEvent(v: any, key: string, fun: any) {
      v.addEventListener(key, fun)
    },
    removeEvent(v: any, key: string, fun: any) {
      v.removeEventListener(key, fun)
    },
    preventDefault(e: any) {
      e.preventDefault()
    },
    stopPropagation(e: any) {
      e.stopPropagation()
    }
  }
}
export default mb