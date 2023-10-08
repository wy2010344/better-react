import { panelWith } from "../panel/PanelContext";
import { ContentEditableModel, initContentEditableModel } from "../contentEditableReact/useContentEditable";
import { emptyArray, useEffect } from "better-react";
import { useRenderCode } from "./renderCode";
import { dom, domOf } from "better-react-dom";
import { KSubsitution, Stream, walk } from "./kanren";
import { VarPool, evalLExp, queryResult } from "./evalExp";
import { renderIf, renderArray, useMemo, useReducer, renderMap } from "better-react-helper";
import { useDragdownX } from "./dragPanel";
import { stringifyLog } from "./stringify";



const storeKey = 'test-logic-editable'
const storeQueryKey = 'test-logic-key-editable'
function initFun(storeKey: string): ContentEditableModel {
  const initValue = localStorage.getItem(storeKey)
  if (initValue) {
    try {
      return JSON.parse(initValue)
    } catch (err) { }
  }
  return initContentEditableModel('')
}

/**
 * =号为定义,:为pair,逗号为and,;为or,,的优先级更高,括号为优先级
 * 并不是很好看,因为逗号分号也是中缀,优先级却较低.英文中间有空格,中文中间无空格,看起来倒是紧密些
 * 仍然应该以char为单位.
 * 但是换行对齐?不需要
 * 或者中缀符号前后的空格都不要
 * 这样变量需要引起来,如[X]
 * 紧凑法,则中缀没必要,所谓中缀,也是需要括号的.
 * 需要将信息层层传导,当聚集的时候,只有一个tooltip,然后显示所有层的信息
 * 
 * 用匹配来理解prolog定义,是一种高级的重载、case when,定义读着当,有一个隐含的匹配上后的断言
 * 查询就是main函数入口,可以有多个main函数,在不同地方入口.副作用改变库,也就是改变代码(下一次从数据库查询的时候结果不一样).所有的异步调起,都是main函数
 * 比如gui的点击事件,promise\settimeout的完成等.将预定义完成作为数据结构传入.
 * 中缀很必要,中缀可以一直连接,然后转化成二元.有了中缀,则优先级也是需要的.
 * 而且prolog表达式是返回布尔值的,只有内置算法中缀才返回结构
 * 现在列表如何直接表达?除pair之外?列表肯定是默认的.用{}
 * 空列表代表空,空变量代表任意,还有内置变量.
 * 组合列表成为内置规则.
 * 主要是and/or如何作为term存储起来应用?
 * ok,这种中缀得到的,是普通的and/or的元组.
 * 
 * :-规则[]
 * 规则:-规则头([=]规则体[.])
 * 规则头:-规则原[]
 * 规则原:-原子|括号
 * 括号:-优先括号|列表括号
 * 原子:-原子(:原子)
 * 有点累,先做个列表吧,不考虑中缀.
 * 或者pair中间不加:
 * 
 * 默认pair无中缀连接,但在{}中的时候最后自动添加上空.
 * 或者用{}表示变量,[]表达列表.
 * ()既能表达优先级(如果只有一个元素,返回自身),也能表达pair相连,即有多个pair自动优先相连
 * 
 * 巨大的主仓库,每个测试案例是一个独立的main函数.
 * 主仓库顶层是各种惯用表达,其下路由着条种情形的处理方式,包括数据库是同一种表达——的处理方式.
 * 
 * append([ ], Y, Y).
 * append([X|L1],L2,[X|L3]):-append(L1,L2,L3).
 * 
 * 做成左右面板,像https://swish.swi-prolog.org/example/examples.swinb一样.
 * 特殊符号作为自然数的列表.
 * 
 * 
 * 如果规则也是list,就会意外合一.比如跟and与or合一.
 * 绝对不冲突的方法,也许需要像prolog一样提取出关键字与顺序.
 * 从含义上说,意外的合一不是预期的
 * 
 */
export default panelWith({
  initWidth: 800,
  bodyStyle: `
  display:flex;
  align-items:stretch;
  `,
  children(operate, id, arg, size, div) {
    const [x, onPointerDown] = useDragdownX(395, function (step) {
      if (step == 'down') {
        document.body.style.userSelect = "none"
      }
      if (step == "up") {
        document.body.style.userSelect = ""
      }
    })

    const {
      value: libValue,
      rules,
      renderContent: renderCodeLibrary
    } = useRenderCode(storeKey, initFun)
    useEffect(() => {
      localStorage.setItem(storeKey, JSON.stringify(libValue))
    }, [libValue])
    //左边
    domOf("div", {
      style: `
      min-width:0;
      width:${x}px;
      display:flex;
      flex-direction:column;
      `
    }).render(function () {
      domOf("b").renderTextContent("规则")
      renderCodeLibrary({
        style: `
        flex:1;
        `
      })
    })
    //分割
    dom.div({
      style: `
      width:10px;
      background:gray;
      flex-shirk:0;
      `,
      onPointerDown
    }).render()
    //右边
    domOf("div", {
      style: `
      min-width:0;
      flex:1;
      display:flex;
      flex-direction:column;
      `
    }).render(function () {

      domOf("b").renderTextContent("查询")
      const [list, appendResult] = useReducer(reducerAdd, emptyArray as ResultModel[])
      domOf("div", {
        style: `
        flex:1;
        overflow-y:auto;
        `
      }).render(function () {
        renderArray(list, getIndex, function (row) {
          domOf("div", {
            style: `
            border:1px solid gray;
            `
          }).render(function () {
            domOf("div", {
              style: `
              border-bottom:1px solid gray;
              `
            }).renderTextContent(row.query)
            const [model, getMore] = useReducer(reducerGetMore, {
              subs: emptyArray as KSubsitution[],
              stream: row.stream
            })
            useEffect(() => {
              getMore(undefined)
            }, emptyArray)
            renderArray(model.subs, getIndex, function (sub) {

              const value = useMemo(() => {
                const out = getResult(sub, row.queryPool)
                return out
              }, [sub])
              if (value) {
                value.forEach(v => {
                  domOf("div").render(function () {
                    domOf("label").renderTextContent(v.key)
                    domOf("span").renderTextContent(v.value)
                  })
                })
              }
            })
            renderIf(model.stream, function () {
              domOf("button", {
                onClick() {
                  getMore(undefined)
                }
              }).renderTextContent("更多结果")
            }, function () {
              domOf("div").renderTextContent("没有更多结果")
            })
          })
        })
      })

      const {
        value: queryValue,
        current: currentQuery,
        rules: querys,
        renderContent
      } = useRenderCode(storeQueryKey, initFun)
      useEffect(() => {
        localStorage.setItem(storeQueryKey, JSON.stringify(queryValue))
      }, [queryValue])

      renderContent()
      domOf("div", {
        style: `
          display:flex;
          justify-content:flex-end;
        `
      }).render(function () {
        domOf("button", {
          onClick() {
            if (querys.length == 0) {
              console.log("没有查询内容")
              return
            }
            const query = querys[0].head
            const queryPool = new VarPool()
            const queryAst = evalLExp(query, queryPool)
            const stream = queryResult(rules, queryAst)
            appendResult({
              query: currentQuery.value,
              queryPool,
              stream
            })
          }
        }).renderTextContent("执行")
      })
    })
  },
})

type ResultModel = {
  query: string
  queryPool: VarPool
  stream: Stream<KSubsitution>
}
function reducerAdd(data: ResultModel[], row: ResultModel) {
  return [...data, row]
}

function getResult(sub: KSubsitution, queryPool: VarPool) {
  if (sub) {
    const out: {
      key: string
      value: string
    }[] = []
    queryPool.forEach(function (value, key) {
      const data = walk(value, sub)
      out.push({
        key,
        value: stringifyLog(data)
      })
    })
    return out
  }
}

function getIndex(_: any, i: number) {
  return i
}

function reducerGetMore(model: {
  subs: KSubsitution[]
  stream: Stream<KSubsitution>
}) {
  const { stream, subs } = model
  if (stream?.left) {
    return {
      subs: [...subs, stream.left],
      stream: stream.right()
    }
  }
  return model
}