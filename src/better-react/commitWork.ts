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

const addes: Fiber[] = []
export function addAdd(fiber: Fiber) {
  addes.push(fiber)
}
const dirtys: Fiber[] = []
export function addDirty(fiber: Fiber) {
  dirtys.push(fiber)
}
const sorts: Fiber[] = []
export function addSort(fiber: Fiber) {
  sorts.push(fiber)
}
/**
 * 提交变更应该从根dirty节点开始。
 * 找到最顶层dirty节点->计算出新的节点替换当前->对比标记新节点->更新
 */
export function commitRoot() {
  dirtys.forEach(function (fiber) {
    fiber.effectTag = undefined
  })
  dirtys.length = 0

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
  //贴到DOM上
  addes.forEach(function (fiber) {
    if (fiber.dom) {
      const domParent = getDomParent(fiber)
      domParent.appendChild(fiber.dom)
      if (fiber.props?.ref) {
        fiber.props.ref(fiber.dom)
      }
    }
    fiber.effectTag = undefined
  })
  //移动
  addes.forEach(function (fiber) {
    if (fiber.dom) {
      const domParent = fiber.dom.parentElement
      const nextDom = getNextElement(fiber.sibling)
      domParent?.insertBefore(fiber.dom, nextDom)
    }
  })
  //初始化
  addes.forEach(function (fiber) {
    fiber.hooks?.effect.forEach(effect => {
      effect({
        deps: effect().deps,
        destroy: effect().effect() as undefined,
        count: effect().count + 1,
        effect: effect().effect
      })
    })
  })
  addes.length = 0
  sorts.forEach(function (sort) {
    const nextDom = getNextElement(sort.sibling)
    let child = sort.child
    const parentDom = getDomParent(sort)
    moveBefore(parentDom, nextDom, child)
  })
  sorts.length = 0
}

function moveBefore(parent: Node, dom: Node | null, fiber?: Fiber) {
  if (fiber) {
    if (fiber.dom) {
      parent.insertBefore(fiber.dom, dom)
    } else {
      moveBefore(parent, dom, fiber.child)
    }
    moveBefore(parent, dom, fiber.sibling)
  }
}

function getNextElement(fiber?: Fiber): Node | null {
  if (fiber) {
    if (fiber.dom) {
      return fiber.dom
    }
    const dom = getNextElement(fiber.child)
    if (dom) {
      return dom
    }
    return getNextElement(fiber.sibling)
  }
  return null
}

function getDomParent(fiber: Fiber) {
  let domParentFiber = fiber.parent
  while (!domParentFiber?.dom) {
    domParentFiber = domParentFiber?.parent
  }
  return domParentFiber.dom
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