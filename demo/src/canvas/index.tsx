import { Point } from "wy-helper"



export class RealNode {

  private nextNode: RealNode | undefined = undefined
  private firstChild: RealNode | undefined = undefined
  /**
   * 父节点调用,告诉父节点自己预期的大小
   * 从根节点调用下来
   * 记录每个子节点的预期大小
   */
  measureAndTellSize() {

    let node = this.firstChild
    while (node) {
      node.measureAndTellSize()
      node = node.nextNode
    }
  }

  /**
   * 父节点调用,设置子节点具体的大小.
   * 从根节点调用下来
   * 子节点可以覆盖强制修改
   * @param loc 
   * @param size 
   */
  setLocationAndSize(loc: Point, size: Point) {

    let node = this.firstChild
    while (node) {
      node.setLocationAndSize(loc, size)
      node = node.nextNode
    }
  }

}