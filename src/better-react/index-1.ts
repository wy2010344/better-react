function createTextElement(text: string) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  }
}
function createElement(type: any, props: Props, ...children: any[]) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      )
    }
  };
}
type BetterNode = {
  type: any
  props: Props
}


export function createFragment(
  ...children: BetterNode[]
) {
  return {
    children
  }
}

type Fiber = {
  type?: any
  dom?: Node
  /**节点属性 */
  props: Props
  /**第一个子节点 */
  child?: Fiber
  /**父Fiber节点 */
  parent?: Fiber
  /**弟节点 */
  sibling?: Fiber
  //旧的成员
  alternate?: Fiber
  //更新方式
  effectTag?: "UPDATE" | "PLACEMENT" | "DELETION"

  hooks?: any[]
}

function commitRoot() {
  deletions?.forEach(commitWork)
  commitWork(wipRoot?.child)
  currentRoot = wipRoot
  wipRoot = undefined
}
/**
 * 提交变更
 * @param fiber 
 * @returns 
 */
function commitWork(fiber?: Fiber) {
  if (!fiber) {
    return
  }
  let domParentFiber = fiber.parent
  while (!domParentFiber?.dom) {
    domParentFiber = domParentFiber?.parent
  }
  const domParent = domParentFiber.dom
  if (fiber.effectTag == 'PLACEMENT' && fiber.dom) {
    domParent?.appendChild(fiber.dom)
  } else if (fiber.effectTag == "DELETION") {
    commitDeletion(fiber, domParent)
  } else if (fiber.effectTag == 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate?.props!, fiber.props)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

/**
 * 需要一直找到具有dom节点的子项
 * @param fiber 
 * @param domParent 
 */
function commitDeletion(fiber: Fiber, domParent: Node) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child!, domParent)
  }
}

type Props = { [key: string]: any }
/**
 * 是否是事件
 * @param key 
 * @returns 
 */
function isEvent(key: string) {
  return key.startsWith("on")
}
/**
 * 是否是属性，非child且非事件
 * @param key 
 * @returns 
 */
function isProperty(key: string) {
  return key != 'children' && !isEvent(key)
}
/**
 * 属性发生变更
 * @param prev 
 * @param next 
 * @returns 
 */
function isNew(prev: Props, next: Props) {
  return function (key: string) {
    return prev[key] != next[key]
  }
}
/**
 * 新属性已经不存在
 * @param prev 
 * @param next 
 * @returns 
 */
function isGone(prev: Props, next: Props) {
  return function (key: string) {
    return !(key in next)
  }
}


/**
 * 创建节点
 * @param fiber 
 * @returns 
 */
function createDom(fiber: Fiber): Node {
  const dom = fiber.type == "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(fiber.type)
  updateDom(dom, {}, fiber.props)
  return dom
}

/**
 * 更新节点
 * @param _dom 
 * @param prevProps 
 * @param nextProps 
 */
function updateDom(_dom: Node, prevProps: Props, nextProps: Props) {
  const dom = _dom as any
  //移除旧事件：新属性中不存在相应事件，或者事件不一样
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      console.log('remove event', eventType)
      dom.removeEventListener(eventType, prevProps[name])
    })
  //移除旧的不存在属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => dom[name] = "")
  //修改变更属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => dom[name] = nextProps[name])

  //添加变更事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      console.log('add event', eventType)
      dom.addEventListener(eventType, nextProps[name])
    })
}

function render(element: BetterNode, container: Node) {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }
  deletions = []
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork: Fiber | undefined = undefined
let wipRoot: Fiber | undefined = undefined
let currentRoot: Fiber | undefined = undefined
let deletions: Fiber[] | undefined = undefined

/**
 * 循环更新界面
 * @param deadline 
 */
function workLoop(deadline: IdleDeadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }
  console.log("redraw")
  requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop);

/**
 * 当前工作结点，返回下一个工作结点
 * 先子，再弟，再父(父的弟)
 * @param fiber 
 * @returns 
 */
function performUnitOfWork(fiber: Fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }
  if (fiber.child) {
    return fiber.child
  }
  /**寻找叔叔节点 */
  let nextFiber: Fiber | undefined = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return undefined
}

let wipFiber: Fiber | undefined = undefined
let hookIndex: number | undefined = undefined

/**
 * 更新函数式组件
 * @param fiber 
 */
function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}


function useState<T>(initial: T) {
  const oldHook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex as number]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [] as ((v: T) => T)[]
  }
  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action: any) => {
    console.log("setState")
    hook.state = action(hook.state)
  })

  const setState = (action: (v: T) => T) => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot?.dom,
      props: currentRoot?.props!,
      alternate: currentRoot
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }
  console.log(hook)
  wipFiber?.hooks?.push(hook)
  hookIndex!++
  return [hook.state, setState]
}
/**
 * 更新原始dom节点
 * @param fiber 
 */
function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}
/**
 * 递归更新子节点
 * @param fiber 
 * @param elements 
 */
function reconcileChildren(fiber: Fiber, elements: any[]) {
  let index = 0
  let oldFiber = fiber.alternate && fiber.alternate.child
  let prevSibling: Fiber | undefined = undefined
  while (
    index < elements.length ||
    oldFiber
  ) {
    const element = elements[index]
    let newFiber: Fiber | undefined = undefined
    if (oldFiber && element && element.type == oldFiber.type) {
      //不变
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: fiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      }
    } else {
      if (element) {
        //新增
        newFiber = {
          type: element.type,
          props: element.props,
          parent: fiber,
          effectTag: "PLACEMENT"
        }
      }
      if (oldFiber) {
        //将要删除的
        oldFiber.effectTag = "DELETION"
        deletions?.push(oldFiber)
      }
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }
    if (index == 0) {
      fiber.child = newFiber
    } else {
      prevSibling!.sibling = newFiber
    }
    prevSibling = newFiber
    index++
  }
}

export default {
  createElement,
  createFragment,
  useState,
  render
}

declare namespace JSX {
  export type Element = BetterNode
}