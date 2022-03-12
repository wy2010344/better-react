import { Fiber } from "./Fiber"
import { updateDom } from "./updateDom"

//等待删除的fiber
const deletions: Fiber[] = []
export function addDelect(fiber: Fiber) {
  deletions.push(fiber)
}
const updates: Fiber[] = []
export function addUpdate(fiber: Fiber) {
  updates.push(fiber)
}
const dirtys: Fiber[] = []
export function addDirty(fiber: Fiber) {
  dirtys.push(fiber)
}
const addes: Fiber[] = []
export function addAdd(fiber: Fiber) {
  addes.push(fiber)
}
/**
 * 提交变更应该从根dirty节点开始。
 * 找到最顶层dirty节点->计算出新的节点替换当前->对比标记新节点->更新
 */
export function commitRoot() {
  deletions.forEach(function (fiber) {
    const domParent = getDomParent(fiber)
    notifyDel(fiber)
    commitDeletion(fiber, domParent)
    fiber.effectTag = undefined
  })
  deletions.length = 0

  updates.forEach(function (fiber) {
    if (fiber.dom) {
      updateDom(fiber.dom!, fiber.alternate?.props, fiber.props)
    }
    fiber.alternate = undefined
    fiber.effectTag = undefined
  })
  updates.length = 0

  dirtys.forEach(function (fiber) {
    fiber.effectTag = undefined
    deepUpdateDirty(fiber)
  })
  dirtys.length = 0
  //初始化
  addes.forEach(function (fiber) {
    fiber.effectTag = undefined
    if (fiber.dom) {
      if (fiber.props?.ref) {
        fiber.props.ref(fiber.dom)
      }
    }
  })
  //避免初始化时，dom元素还未生成
  addes.forEach(function (fiber) {
    fiber.hooks?.effect.forEach(effect => {
      effect({
        deps: effect().deps,
        destroy: effect().effect() as undefined,
        effect: effect().effect
      })
    })
  })
  addes.length = 0
}

function deepUpdateDirty(fiber: Fiber) {
  let child = fiber.child
  let prevChild: Fiber | undefined
  while (child) {
    child.prev = prevChild
    if (child.dom) {
      const parentBefore = child.prev
        ? getCurrentBefore(child.prev)
        : findParentBefore(child)
      if (parentBefore) {
        const [parent, before] = parentBefore
        const next = before?.nextSibling
        if (next != child.dom) {
          //不处理
          parent.insertBefore(child.dom, next!)
        }
      } else {
        console.error("未找到", child.dom)
      }
    }
    deepUpdateDirty(child)
    const nextChild = child.sibling
    if (!nextChild) {
      fiber.lastChild = child
    }
    prevChild = child
    child = nextChild
  }
}

function getCurrentBefore(fiber: Fiber): [Node, Node | null] | null {
  if (fiber.dom) {
    return [fiber.dom.parentElement!, fiber.dom]
  }
  if (fiber.lastChild) {
    //在子节点中寻找
    const dom = getCurrentBefore(fiber.lastChild)
    if (dom) {
      return dom
    }
  }
  if (fiber.prev) {
    //在兄节点中找
    const dom = getCurrentBefore(fiber.prev)
    if (dom) {
      return dom
    }
  }
  return findParentBefore(fiber)
}

function findParentBefore(fiber: Fiber): [Node, Node | null] | null {
  const parent = fiber.parent
  if (parent) {
    if (parent.dom) {
      //找到父节点，且父节点是有dom的
      return [parent.dom, null]
    }
    if (parent.prev) {
      //在父的兄节点中寻找
      const dom = getCurrentBefore(parent.prev)
      if (dom) {
        return dom
      }
    }
    return findParentBefore(parent)
  }
  return null
}

function getParentDomFilber(fiber: Fiber) {
  let domParentFiber = fiber.parent
  while (!domParentFiber?.dom) {
    domParentFiber = domParentFiber?.parent
  }
  return domParentFiber
}
function getDomParent(fiber: Fiber) {
  return getParentDomFilber(fiber).dom!
}
/**
 * 需要一直找到具有dom节点的子项
 * @param fiber 
 * @param domParent 
 */
function commitDeletion(fiber: Fiber, domParent: Node) {
  if (fiber.dom) {
    removeFromDom(fiber, domParent)
  } else {
    circleCommitDelection(fiber.child, domParent)
  }
}
function circleCommitDelection(fiber: Fiber | undefined, domParent: Node) {
  if (fiber) {
    if (fiber.dom) {
      removeFromDom(fiber, domParent)
    } else {
      circleCommitDelection(fiber.child, domParent)
    }
    circleCommitDelection(fiber.sibling, domParent)
  }
}
function removeFromDom(fiber: Fiber, domParent: Node) {
  if (fiber.props?.exit) {
    fiber.props.exit(fiber.dom).then(function () {
      domParent.removeChild(fiber.dom!)
    })
  } else {
    domParent.removeChild(fiber.dom!)
  }
  if (fiber.props?.ref) {
    fiber.props.ref(null)
  }
}


function notifyDel(fiber: Fiber) {
  destroyFiber(fiber)
  if (fiber.child) {
    let next: Fiber | undefined = fiber.child
    while (next) {
      notifyDel(next)
      next = next.sibling
    }
  }
}

function destroyFiber(fiber: Fiber) {
  const effect = fiber.hooks?.effect
  if (effect) {
    effect.forEach(ef => ef().destroy?.())
  }
}