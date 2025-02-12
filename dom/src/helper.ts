import { hookEnvModel, TempOps } from "better-react"
import { createNodeTempOps, ListCreater } from "./util"
import { emptyFun, EmptyFun, emptyObject, SyncFun } from "wy-helper"
import { DomType, isSyncFun, Props } from "wy-dom-helper"

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

function updateContent(value: string | number, node: any, type: ContentType) {
  if (type == 'html') {
    node.innerHTML = value
  } else {
    node.textContent = value
  }
}
type ContentType = "html" | "text"
export class NodeHelper<T extends Element, Attr extends {}> {
  constructor(
    public readonly node: T,
    public readonly type: DomType,
    private readonly updateAttr: (node: T, attrs: Attr, oldAttrs: Attr, oldDes: any, type: DomType) => any,
  ) { }
  private tempOps!: TempOps<ListCreater>

  private oldDes = {}

  private oldAttrs: any = emptyObject as any
  updateAttrs(attrs: Attr) {
    this.oldDes = this.updateAttr(this.node, attrs, this.oldAttrs, this.oldDes, this.type)
    this.oldAttrs = attrs
  }


  destroy() {
    destroyOldDes(this.oldDes)
    this.desContent()
  }

  private desContent: EmptyFun = emptyFun
  private lastType: ContentType = undefined!
  private lastContent: string | number | SyncFun<string | number> = ''
  updateContent(type: ContentType, content: string | number | SyncFun<string | number>) {
    if (type == this.lastType && content == this.lastContent) {
      return
    }
    this.lastType = type
    this.lastContent = content
    this.desContent()
    if (isSyncFun(content)) {
      this.desContent = content(updateContent, this.node, type)
    } else {
      this.desContent = emptyFun
      updateContent(content, this.node, type)
    }
  }

  getTempOps() {
    if (!this.tempOps) {
      this.tempOps = createNodeTempOps(this.node, hookEnvModel().createChangeAtom)
    }
    return this.tempOps
  }
}