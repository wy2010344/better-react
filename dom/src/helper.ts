import { EffectEvent, hookEnvModel, TempOps } from "better-react"
import { createNodeTempOps, ListCreater } from "./util"
import { emptyObject, objectDiffDeleteKey } from "wy-helper"
import { Props, updateDom } from "wy-dom-helper"

export function destroyOldDes(attrs: Record<string, any>) {
  for (const key in attrs) {
    const value = attrs[key]
    if (value) {
      if (key == 'style') {
        if (typeof value == 'function') {
          value()
        } else {
          for (const subKey in value) {
            value[subKey]?.()
          }
        }
      } else {
        value()
      }
    }
  }
}

export class NodeHelper<T extends Element, Attr extends {}> {
  constructor(
    public readonly node: T,
    private readonly updateAttr: (node: T, attrs: Attr, oldAttrs: Attr, oldDes: any) => any,
    // private readonly updateProps: (node: Node, key: string, value?: any) => void
  ) { }
  private tempOps!: TempOps<ListCreater>

  private oldDes = {}

  private oldAttrs: any = emptyObject as any
  updateAttrs(attrs: Attr) {
    this.oldDes = this.updateAttr(this.node, attrs, this.oldAttrs, this.oldDes)
    // this.oldDes = updateDom(this.node, this.updateProps, attrs, this.oldAttrs, this.oldDes)
    this.oldAttrs = attrs
  }
  destroy() {
    destroyOldDes(this.oldDes)
  }

  updateHTMLTrigger = (e: EffectEvent<undefined, string>) => {
    this.node.innerHTML = e.trigger
  }

  updateTextTrigger = (e: EffectEvent<undefined, string>) => {
    this.node.textContent = e.trigger
  }

  getTempOps() {
    if (!this.tempOps) {
      this.tempOps = createNodeTempOps(this.node, hookEnvModel().createChangeAtom)
    }
    return this.tempOps
  }
}

export function updateDomAttrs(
  updateProps: (node: Node, key: string, value?: any) => void
) {
  return (node: Node, attrs: Props, oldAttrs: Props, oldDes: any) => {
    return updateDom(node, updateProps, attrs, oldAttrs, oldDes)
  }
}


export function updateFDomAttrs() {
  return (node: Node, attrs: Props, oldAttrs: Props, oldDes: any) => {
    objectDiffDeleteKey(oldAttrs, attrs, function (key) {

    })
  }
}