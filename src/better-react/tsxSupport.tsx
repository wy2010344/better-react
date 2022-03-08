import { BetterNode } from "./Fiber"

export namespace JSX {

  export interface IntrinsicElements {
    [key: string]: {
      [key: string]: any
    }
  }

  type FC<T> = (arg: T & { key?: any }) => BetterNode
  /**与mve-core核心类型的兼容性 */
  export type Element<T> = {
    type: FC<T>
    props: T & {
      key?: any
    }
  }
  /**
   * TSX内容元素类型，需要先声明
   */
  export interface ElementChildrenAttribute {
    children: any// specify children name to use
  }
}