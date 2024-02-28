import { Options, OptionsConstructor } from "./Options";
import Scroller from "./scroller/scroller";
import { warn } from "./utils/debug";
import { getElement } from "./utils/dom";
import { ApplyOrder } from "./utils/enums";
import { EventEmitter } from "./utils/events";
import { isUndef } from "./utils/lang";
interface PluginCtor {
  pluginName: string
  applyOrder?: ApplyOrder
  new(scroll: BScroll): any
}

interface PluginItem {
  name: string
  applyOrder?: ApplyOrder.Pre | ApplyOrder.Post
  ctor: PluginCtor
}
interface PluginsMap {
  [key: string]: boolean
}
interface PropertyConfig {
  key: string
  sourceKey: string
}


type ElementParam = HTMLElement | string

export class BScrollConstructor<O = {}> extends EventEmitter {
  static plugins: PluginItem[] = []
  static pluginsMap: PluginsMap = {}
  scroller: Scroller
  options: OptionsConstructor
  hooks: EventEmitter = null!
  plugins: { [name: string]: any }
  wrapper: HTMLElement
  content: HTMLElement;
  [key: string]: any

  //全局加载插件
  static use(ctor: PluginCtor) {
    const name = ctor.pluginName
    const installed = BScrollConstructor.plugins.some(
      plugin => ctor === plugin.ctor
    )
    if (installed) return BScrollConstructor
    if (isUndef(name)) {
      warn(
        `Plugin Class must specify plugin's name in static property by 'pluginName' field.`
      )
      return BScrollConstructor
    }
    BScrollConstructor.pluginsMap[name] = true
    BScrollConstructor.plugins.push({
      name,
      applyOrder: ctor.applyOrder,
      ctor
    })
    return BScrollConstructor
  }
  constructor(el: ElementParam, options?: Options & O) {
    super([
      'refresh',
      'contentChanged',
      'enable',
      'disable',
      'beforeScrollStart',
      'scrollStart',
      'scroll',
      'scrollEnd',
      'scrollCancel',
      'touchEnd',
      'flick',
      'destroy'
    ])
    const wrapper = getElement(el)
    if (!wrapper) {
      warn('Can not resolve the wrapper DOM.')
      return
    }

    this.plugins = {}
    this.options = new OptionsConstructor().merge(options).process()

    if (!this.setContent(wrapper).valid) {
      return
    }

    this.hooks = new EventEmitter([
      'refresh',
      'enable',
      'disable',
      'destroy',
      'beforeInitialScrollTo',
      'contentChanged'
    ])
    this.init(wrapper)
  }

  private init(wrapper: MountedBScrollHTMLElement) {
    this.wrapper = wrapper
    // mark wrapper to recognize bs instance by DOM attribute
    wrapper.isBScrollContainer = true
    this.scroller = new Scroller(wrapper, this.content, this.options)

  }
}

export interface MountedBScrollHTMLElement extends HTMLElement {
  isBScrollContainer?: boolean
}




export type BScroll<O = Options> = BScrollConstructor<O> &
  UnionToIntersection<ExtractAPI<O>>

export const BScroll = (createBScroll as unknown) as BScrollFactory