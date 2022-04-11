import { addAdd, addDelect, addUpdate } from "./commitWork"
import { Fiber, getFiberKey, getPool } from "./Fiber"

/**
 * 更新子节点为新的计算后的fiber
 * @param fiber 
 * @param elements 
 * @param mustKey 是否必须验证key
 */
export function reconcileChildren(fiber: Fiber, elements?: any[], mustKey?: boolean) {
  if (!Array.isArray(elements)) {
    return
  }
  //旧节点
  const alternate = fiber.alternate
  let index = 0
  //旧节点的第一个
  let oldFiber = alternate?.child
  let prevSibling: Fiber | undefined = undefined

  while (
    index < elements.length
    || oldFiber
  ) {
    const element = getElement(elements[index])
    let newFiber: Fiber | undefined = undefined
    if (element) {
      if (!element.props) {
        console.warn("不合法的节点", element)
      }
      const key = element.props.key
      if (existKey(key)) {
        //如果有key,优先去寻找旧池中的key。
        const oldKeyFiber = getFiberKey(alternate, key)
        if (oldKeyFiber && oldKeyFiber.type == element.type) {
          //如果找到了，就更新
          newFiber = {
            type: oldKeyFiber.type,
            render: element.render,
            props: element.props,
            dom: oldKeyFiber.dom,
            parent: fiber,
            alternate: oldKeyFiber,
            effectTag: "UPDATE"
          }
          addUpdate(newFiber)
        } else {
          //没找到，就新建
          newFiber = {
            type: element.type,
            render: element.render,
            props: element.props,
            parent: fiber,
            effectTag: "PLACEMENT"
          }
          addAdd(newFiber)
        }
        const pool = getPool(fiber)
        if (pool.has(key)) {
          console.error("key值重复存在在", key)
        } else {
          pool.set(key, newFiber)
        }
        if (oldFiber && !existKey(oldFiber.props?.key)) {
          //旧节点存在且为无key节点
          oldFiber.effectTag = "DELETION"
          addDelect(oldFiber)
        }
      } else {
        //当前成员没有key
        if (oldFiber) {
          //如果有旧成员
          if (!existKey(oldFiber.props?.key)) {
            //旧成员存在pool中，需要确认是否被复用。暂不管
            //旧成员没有key，按位比较
            if (element.type == oldFiber.type) {
              //匹配上，同位更新
              newFiber = {
                type: oldFiber.type,
                props: element.props,
                render: element.render,
                dom: oldFiber.dom,
                parent: fiber,
                alternate: oldFiber,
                effectTag: "UPDATE"
              }
              addUpdate(newFiber)
            } else {
              //没匹配上，新增旧删
              newFiber = {
                type: element.type,
                render: element.render,
                props: element.props,
                parent: fiber,
                effectTag: "PLACEMENT"
              }
              addAdd(newFiber)
              //旧删
              oldFiber.effectTag = "DELETION"
              addDelect(oldFiber)
            }
          }
        } else {
          //没有匹配位置的旧元素，新加
          newFiber = {
            type: element.type,
            render: element.render,
            props: element.props,
            parent: fiber,
            effectTag: "PLACEMENT"
          }
          addAdd(newFiber)
        }
      }
    } else {
      //这个位置已经没有新节点
      if (oldFiber) {
        //如果有旧节点
        const oldKey = oldFiber.props?.key
        if (!existKey(oldKey)) {
          //如果有key，在最后决定删除
          //没有对应，删除
          oldFiber.effectTag = "DELETION"
          addDelect(oldFiber)
        }
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

  const pool = alternate?.pool
  const newPool = fiber.pool
  if (pool) {
    if (newPool) {
      //找出所有旧成员中，新成员未使用的
      pool.forEach(function (v, k) {
        if (newPool.get(k)?.type == v.type) {
          //被复用了
        } else {
          //需要删除
          v.effectTag = "DELETION"
          addDelect(v)
        }
      })
    } else {
      //清空旧成员的
      pool.forEach(function (v, k) {
        v.effectTag = "DELETION"
        addDelect(v)
      })
    }
  }
}

function getElement(element: any) {
  if (Array.isArray(element)) {
    return {
      type: reconcileChildren,
      props: {
        children: element
      }
    }
  }
  return element
}

function existKey(key: any) {
  return key !== undefined
}