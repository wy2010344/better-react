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
    fiber.effectTag = undefined
  })
  updates.length = 0

  addes.forEach(function (fiber) {
    if (fiber.dom) {
      const domParent = getDomParent(fiber)
      domParent?.appendChild(fiber.dom)
    }
    fiber.effectTag = undefined
  })
  addes.length = 0
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
    domParent.removeChild(fiber.dom)
  } else {
    circleCommitDelection(fiber.child, domParent)
  }
}
function circleCommitDelection(fiber: Fiber | undefined, domParent: Node) {
  if (fiber) {
    if (fiber.dom) {
      domParent.removeChild(fiber.dom)
    } else {
      circleCommitDelection(fiber.child, domParent)
    }
    circleCommitDelection(fiber.sibling, domParent)
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