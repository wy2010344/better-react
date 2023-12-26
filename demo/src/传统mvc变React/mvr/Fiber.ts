import { VirtaulDomNode, arrayNotEqualDepsWithEmpty } from "better-react"

type EffectTag = "PLACEMENT" | "UPDATE"

export type HookMemo<T, V extends readonly any[] = readonly any[]> = {
  effect(deps: V): T,
  getDeps?(): V
  getValue(): T
  cacheDeps?: V
  cachaValue?: T
}
export type HookValueOut<T> = [() => T, (v: T) => void]
export type HookValue<T> = {
  value: T
  out: HookValueOut<T>
}
export type HookEffect = {
  deps?: readonly any[]
  destroy?: void | ((deps?: readonly any[]) => void)
}
type RenderDeps = {
  deps?: readonly any[],
  render(deps?: readonly any[]): void
}
export class Fiber {
  destroyed = false
  effectTag?: EffectTag = 'PLACEMENT'
  hookMemo?: HookMemo<any, any>[]
  hookValue?: HookValue<any>[]
  hookEffects?: Map<number, HookEffect[]>

  contextProvider?: Map<any, {
    changeValue(v: any): void
  }>
  hookContextCosumer?: HookContextCosumer<any, any>[]

  public firstChild?: Fiber
  public lastChild?: Fiber
  public before?: Fiber
  public next?: Fiber
  private constructor(
    public readonly parent: Fiber | undefined,
    public readonly dom: VirtaulDomNode | undefined,
    public renderDeps: RenderDeps
  ) { }

  changeRender(render: (deps?: readonly any[]) => void, deps?: readonly any[]) {
    const { deps: oldDeps } = this.renderDeps
    if (arrayNotEqualDepsWithEmpty(oldDeps, deps)) {
      //能改变render,需要UPDATE
      this.renderDeps = {
        render,
        deps
      }
      this.effectTag = "UPDATE"
    }
  }
  /**
   * 创建一个固定节点,该节点是不是MapFiber不一定
   * @param rd 
   * @param dynamicChild 
   */
  static create(
    parentFiber: Fiber,
    dom: VirtaulDomNode | undefined,
    rd: RenderDeps
  ) {
    const fiber = new Fiber(
      parentFiber,
      dom,
      rd)
    return fiber
  }

  render() {
    const { render, deps } = this.renderDeps
    render(deps)
    this.effectTag = undefined
  }
}
export type HookContextCosumer<T, M> = {
  getValue(): M
  select(v: T): M
  shouldUpdate?(a: M, b: M): boolean
  destroy(): void
}