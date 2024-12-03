import {
  DomElementType, domTagNames, XDomAttribute, renderXNodeAttr
} from "wy-dom-helper";
import { createOrProxy } from "wy-helper";


export const Dom = createOrProxy(domTagNames, function <T extends DomElementType>(tag: T) {

  return function (args: XDomAttribute<T>) {
    renderXNodeAttr
  }
})