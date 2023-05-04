import { render, useMap, useOne } from "better-react";
import { useDom } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";
import { useBaseGuard, useGuardString, useState } from "better-react-helper"

export default normalPanel(function (operate, id) {



  useDom("div", {
    children() {
      const [index2, setIndex2] = useState(0)
      useDom("button", {
        textContent: "测试button-2/" + index2,
        onClick(e) {
          e.stopPropagation()
          setIndex2(index => index + 1)
        }
      })

      //测试useOne()
      // 测试useMap()
      // 测试useMapString()
      测试useBaseGuard()
    }
  })
})

function 测试useOne() {
  const [index, setIndex] = useState<IndexModel>({ key: 0 })
  useDom("button", {
    textContent: "测试button" + index.key,
    onClick(e) {
      e.stopPropagation()
      setIndex(index => ({ key: index.key + 1 }))
    }
  })
  useDom("button", {
    textContent: "复制" + index.key,
    onClick(e) {
      e.stopPropagation()
      setIndex(index => ({ key: index.key }))
    }
  })
  useOne(index, quoteOne, renderOne, indexShouldUpdate)
}

function 测试useMapString() {
  const [key, setKey] = useState<'a' | 'b' | 'c'>('a')

  useDom("button", {
    textContent: "测试useKey",
    onClick(e) {
      e.stopPropagation()
      if (key == 'a') {
        setKey('b')
      } else if (key == 'b') {
        setKey('c')
      } else if (key == 'c') {
        setKey('a')
      }
    }
  })
  useGuardString(key, map)
}
type IndexModel = {
  key: number
}
function quoteOne(i: IndexModel) {
  return i.key
}
function indexShouldUpdate(a: IndexModel, b: IndexModel) {
  console.log("判断")
  return a.key != b.key
}
function renderOne(i: IndexModel) {
  console.log("测试render---", i.key)
  return useDom("div", {
    textContent: `这是内容${i.key}`
  })
}


const map = {
  a() {
    console.log("map--a")
    useDom("div", {
      textContent: "---a"
    })
  },
  b() {
    console.log("map--b")
    useDom("div", {
      textContent: "---b"
    })
  },
  c() {
    console.log("map--c")
    useDom("div", {
      textContent: "---c"
    })
  }
}

function 测试useMap() {

  const [list, setList] = useState<IndexModel[]>([])
  useDom("button", {
    textContent: "测试button-2/" + list.length,
    onClick(e) {
      e.stopPropagation()
      setList(list => list.concat({ key: list.length }))
    }
  })
  useDom("button", {
    textContent: "浅复制",
    onClick(e) {
      e.stopPropagation()
      setList(list => list.slice())
    }
  })
  useDom("button", {
    textContent: "深复制",
    onClick(e) {
      e.stopPropagation()
      setList(list => JSON.parse(JSON.stringify(list)))
    }
  })
  useMap(list, quoteOne, renderOne, indexShouldUpdate)
}

function 测试useBaseGuard() {

  const [index, setIndex] = useState<IndexModel>({ key: 0 })
  useDom("button", {
    textContent: "测试button" + index.key,
    onClick(e) {
      e.stopPropagation()
      setIndex(index => ({ key: index.key + 1 }))
    }
  })
  useDom("button", {
    textContent: "复制" + index.key,
    onClick(e) {
      e.stopPropagation()
      setIndex(index => ({ key: index.key }))
    }
  })
  useBaseGuard(index, baseGuards, indexShouldUpdate)
}

const baseGuards: Array<readonly [
  (a: IndexModel) => boolean,
  (a: IndexModel) => void
]> = [
    [
      (a: IndexModel) => a.key % 2 == 1,
      (a: IndexModel) => {
        console.log("render,奇数--", a.key)
        useDom("div", {
          textContent: '这是奇数' + a.key
        })
      }
    ],
    [
      (a: IndexModel) => a.key % 2 == 0,
      (a: IndexModel) => {
        console.log("render,偶数--", a.key)
        useDom("div", {
          textContent: '这是偶数' + a.key
        })
      }
    ]
  ]