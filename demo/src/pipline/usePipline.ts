import { DomAttribute, DomElementType, SvgAttribute, SvgElementType, dom, svg } from "better-react-dom";
import { EmptyFun, run } from "wy-helper";
import { KPair, pair } from "wy-helper/kanren";



/**
 * children当然可以用pair左右子树,始终组合而不去拆开
 */
type PiplineChildren = KPair<PiplineChildren, PiplineChildren> | EmptyFun

function renderChildren(children: PiplineChildren) {
  if (children instanceof KPair) {
    renderChildren(children.left)
    renderChildren(children.right)
  } else {
    children()
  }
}
class Pipline {
  constructor(
    private renderWrapper: (fun: EmptyFun) => void,
    private readonly children: PiplineChildren
  ) { }
  usePrepend(fun: EmptyFun) {
    return new Pipline(
      this.renderWrapper,
      pair(fun, this.children))
  }
  useAppend(fun: EmptyFun) {
    return new Pipline(this.renderWrapper,
      pair(this.children, fun))
  }

  private binded = false
  getRender() {
    if (!this.binded) {
      this.binded = true
      this.render = this.render.bind(this)
    }
    return this.render
  }
  useWrapInDom<key extends DomElementType>(type: key, attrs: DomAttribute<key>) {
    return new Pipline((fun) => {
      dom[type](attrs).render(fun)
    }, this.getRender())
  }
  useWrapInSvg<key extends SvgElementType>(type: key, attrs: SvgAttribute<key>) {
    return new Pipline((fun) => {
      svg[type](attrs).render(fun)
    }, this.getRender())
  }
  render() {
    this.renderWrapper(() => {
      renderChildren(this.children)
    })
  }
}
export function usePipline(fun: EmptyFun) {
  return new Pipline(run, fun)
}