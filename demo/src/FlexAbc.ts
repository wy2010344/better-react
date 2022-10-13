import { useDom } from "better-react-dom"
import { normalPanel } from "./panel/PanelContext"

export const FlexAbc = () => {

}

export default normalPanel(() => {
  useDom("div", {
    children() {

    },
  })
})

/**
 * 通常,flex还可能指定尺寸
 * 字符串有个最大长度,否则就是flex=1的长度,超出了就收缩.
 * 还有遇到不满足了,自动降级
 */
const direction = ["x", "y"]

const justify: {
  justifyContent: string
  longFrom: "parent" | "children"
  childrenLongFrom: ("parent" | "self")[]
  gap?: true
}[] = [
    {
      justifyContent: "space-around",
      longFrom: "parent",
      childrenLongFrom: ['self']
    },
    {
      justifyContent: "space-between",
      longFrom: "parent",
      childrenLongFrom: ['self']
    },
    {
      justifyContent: "space-evenly",
      longFrom: "parent",
      childrenLongFrom: ['self']
    },
    {
      justifyContent: "start",
      longFrom: "parent",
      childrenLongFrom: ['self'],
      gap: true
    },
    {
      justifyContent: "end",
      longFrom: "parent",
      childrenLongFrom: ['self'],
      gap: true
    },
    {
      justifyContent: "center",
      childrenLongFrom: ['self'],
      longFrom: "parent",
      gap: true
    },
    {
      justifyContent: "have-flex",
      longFrom: "parent",
      /**flex元素来自parent,非flex元素来自自身 */
      childrenLongFrom: ['parent', 'self'],
      gap: true
    },
    {
      justifyContent: "dynamic",
      longFrom: "children",
      childrenLongFrom: ['self'],
      gap: true
    }
  ]


/**其它children有alignself对标flex伸缩 */
const align: {
  alignItems: string
  longFrom: "parent" | "children"
  childrenLongFrom: ("parent" | "self")[]
}[] = [
    {
      alignItems: "start",
      longFrom: "parent",
      childrenLongFrom: ['self']
    },
    {
      alignItems: "end",
      longFrom: "parent",
      childrenLongFrom: ['self']
    },
    {
      alignItems: "center",
      longFrom: "parent",
      childrenLongFrom: ['self']
    },
    {
      alignItems: "stretch",
      longFrom: "parent",
      childrenLongFrom: ['parent']
    },
    {
      alignItems: "any",
      longFrom: "parent",
      /**对于stretch的,依赖parent,否则为self.其实和前面是重复的. */
      childrenLongFrom: ['parent', 'self']
    },
    {
      alignItems: "dynamic",
      longFrom: "children",
      childrenLongFrom: ['self']
    }
  ]
function getWidthD(d: string) {
  if (d == 'x') {
    return 'width'
  }
  return 'height'
}
function oppositeD(d: string) {
  if (d == 'x') {
    return 'height'
  } else {
    return 'width'
  }
}

function generateTest() {
  const list = []
  for (let d of direction) {
    for (let j of justify) {
      for (let a of align) {
        list.push({
          direction: d,
          justifyContent: j.justifyContent,
          gap: j.gap,
          [getWidthD(d)]: j.longFrom,

          alignItems: a.alignItems,
          [oppositeD(d)]: a.longFrom
        })
      }
    }
  }


}

type FlexColumn = {
  direction: "column"
}
type FlexRow = {
  direction: "row"
}

/**轴向长度由父容器决定--子元素尺寸自定义 */
type FixLong = {
  justifyContent: "space-around" | "space-between" | "space=evenly"
} | {
  justifyContent: "center" | "start" | "end"
  gap?: number
} | {
  /**有子元素含有填充剩余--填充物由父元素决定 */
  justifyContent: "have-flex"
  gap?: number
}
/**轴向长度由子容器决定--子容器需要固定*/
type DynamicLong = {
  gap?: number
}

/**径向固定大小---除stretch,子元素维度自己自定义 */
type FixShort = {
  alignItems: "start" | "end" | "center" | "stretch"
}
/**
 * 径向由子容器决定大小
 */
type DynamicShort = {
}