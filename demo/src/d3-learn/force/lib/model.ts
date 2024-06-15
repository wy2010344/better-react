
export type Node = {
  index: number

  fx?: number
  x: number
  vx: number

  fy?: number
  y: number
  vy: number

  fz?: number
  z: number
  vz: number
}
export type SetV = (v: Node, i: number, vs: Node[]) => number

export type SetL = (v: Link, i: number, vs: Link[]) => number
export type Link = {
  index: number
  source: Node
  target: Node
}
export type DIMType = 1 | 2 | 3


export type TreeNode<T> = {
  x: number
  y: number
  z: number
  r: number
  value: number
  data: T
  next: TreeNode<T>
} & Array<TreeNode<T>>