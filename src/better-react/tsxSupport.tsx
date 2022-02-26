export namespace JSX {
  /**禁止所有内建小写元素 */
  export interface IntrinsicElements {
    [key: string]: any
  }
  /**与mve-core核心类型的兼容性 */
  export type Element = {
    type: any
    props: any
  }
  /**
   * TSX内容元素类型，需要先声明
   */
  export interface ElementChildrenAttribute {
    children: any// specify children name to use
  }
}