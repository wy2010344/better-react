import { emptyArray } from "better-react";
import { renderArray, renderArrayWithIndexAsKey, renderIf, useMemo, useReducer } from "better-react-helper";
import { VarPool } from "./evalExp";
import { DelayStream, KSubsitution, Stream, walk } from "./kanren";
import { stringifyLog } from "./stringify";
import { domOf } from "better-react-dom";


export function useRenderResult() {
  const [list, appendResult] = useReducer(reducerAdd, emptyArray as ResultModel[])
  return {
    appendResult,
    renderContent() {

      renderArrayWithIndexAsKey(list, function (row) {
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
          const [model, getMore] = useReducer(reducerGetMore, '', () => {
            const subs: KSubsitution[] = []
            return toSubs(subs, row.stream)
          })
          renderArrayWithIndexAsKey(model.subs, function (sub) {
            const value = useMemo(() => {
              const out = getResult(sub, row.queryPool)
              return out
            }, [sub])
            if (value?.length) {
              value.forEach(v => {
                domOf("div").render(function () {
                  domOf("label").renderTextContent(v.key)
                  domOf("span").renderTextContent(v.value)
                })
              })
            } else {
              domOf("div").renderTextContent("成功")
            }
          })
          renderIf(model.next, function () {
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
    }
  }
}


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
function reducerGetMore(model: {
  subs: KSubsitution[]
  next?: DelayStream<KSubsitution>
}) {
  const { next, subs } = model
  if (next) {
    const nextV = next()
    const newSubs = subs.slice()
    return toSubs(newSubs, nextV)
  }
  return model
}


function toSubs(subs: KSubsitution[], stream?: Stream<KSubsitution>) {
  const left = stream ? stream.left : undefined
  if (left) {
    subs.push(left)
  }
  return {
    subs,
    next: stream ? stream.right : undefined
  }
}