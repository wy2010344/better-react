import { React, domOf, portalDomOf } from "better-react-dom";
import { renderFragment, renderIf, useChange, useMemo } from "better-react-helper";
import { ContentEditableModel, contentDelete, contentEnter, contentTab, getCurrentRecord, useContentEditable } from "better-react-dom-helper";
import { mb } from "better-react-dom-helper";
import { LToken, keywords, tokenize } from "./tokenize";
import { emptyArray, useEffect } from "better-react";
import { parseQuery, parseRules } from "./parse";
import { css } from "stylis-creater";
import { useErrorContextProvide } from "./errorContext";
import { AreaAtom, buildViewPairs, isAreaCode } from "./buildViewPairs";


function useRenderCode<T>(
  init: T,
  initFun: (v: T) => ContentEditableModel
) {
  const { value, dispatch, current, renderContentEditable } = useContentEditable(init, initFun)
  return {
    value,
    current,
    renderContent(
      list: AreaAtom[],
      props?: React.HTMLAttributes<HTMLDivElement> & {
        readonly?: boolean
      }
    ) {
      renderContentEditable({
        readonly: props?.readonly
      }, function () {
        const div = domOf("div", {
          ...props,
          spellcheck: false,
          className: `${codeAreaStyle} ${props?.className || ''}`,
          onInput(event: any) {
            if (event.isComposing) {
              return
            }
            dispatch({
              type: "input",
              record: getCurrentRecord(div)
            })
          },
          onCompositionEnd(event) {
            dispatch({
              type: "input",
              record: getCurrentRecord(div)
            })
          },
          onKeyDown(e) {
            if (mb.DOM.keyCode.TAB(e)) {
              e.preventDefault()
              const record = contentTab(div, e.shiftKey)
              if (record) {
                dispatch({
                  type: "input",
                  record
                })
              }
            } else if (mb.DOM.keyCode.ENTER(e)) {
              e.preventDefault()
              const record = contentEnter(div)
              dispatch({
                type: "input",
                record
              })
            } else if (mb.DOM.keyCode.Z(e)) {
              if (isCtrl(e)) {
                if (e.shiftKey) {
                  //redo
                  e.preventDefault()
                  dispatch({
                    type: "redo"
                  })
                } else {
                  //undo
                  e.preventDefault()
                  dispatch({
                    type: "undo"
                  })
                }
              }
            } else if (mb.DOM.keyCode.BACKSPACE(e)) {
              e.preventDefault()
              const record = contentDelete(div)
              if (record) {
                dispatch({
                  type: "input",
                  record
                })
              }
            }
          },
        }).render(function () {
          list.forEach(renderAreaCode)
        })
        return div
      })
    }
  }
}
export function useRenderCodeData<T>(
  init: T,
  initFun: (v: T) => ContentEditableModel
) {
  const { value, current, renderContent } = useRenderCode(init, initFun)
  const { list, rules } = useMemo(() => {
    const tokens = tokenize(current.value)
    const { errorAreas, rules, asts } = parseRules(tokens)
    return {
      list: buildViewPairs(tokens, asts, errorAreas),
      rules
    }
    // return []
  }, [current.value])
  return {
    value,
    current,
    rules,
    renderContent(
      props?: React.HTMLAttributes<HTMLDivElement> & {
        readonly?: boolean
      }
    ) {
      renderContent(list, props)
    }
  }
}

export function useRenderQuery<T>(
  init: T,
  initFun: (v: T) => ContentEditableModel
) {
  const { value, current, renderContent } = useRenderCode(init, initFun)
  const { list, query } = useMemo(() => {
    const tokens = tokenize(current.value)
    const { errorAreas, query, asts } = parseQuery(tokens)
    return {
      list: buildViewPairs(tokens, asts, errorAreas),
      query
    }
    // return []
  }, [current.value])
  return {
    value,
    current,
    query,
    renderContent(
      props?: React.HTMLAttributes<HTMLDivElement> & {
        readonly?: boolean
      }
    ) {
      renderContent(list, props)
    }
  }
}


function isCtrl(e: React.KeyboardEvent) {
  return e.metaKey || e.ctrlKey
}


const codeAreaStyle = css`
min-height:30px;
.error{
  outline:1px solid red;//text-decoration: red wavy underline;
}

background: hsl(30, 20%, 25%);
padding: .15em .2em .05em;
border-radius: .3em;
border: .13em solid hsl(30, 20%, 40%);
box-shadow: 1px 1px .3em -.1em black inset;
white-space: normal;
.token{
  margin-inline:0.1em;
  line-height: 1.5em;
  &.var{
  	color: hsl(40, 90%, 60%);
    background-color: #231926;
    /* color:hsl(30, 50%, 40%); */
  }
  &.block{
    /* color: hsl(350, 40%, 70%);
    background-color: #231926; */
    color:hsl(0, 0%, 70%);
  }
  &.keyword{
	  color: hsl(75, 70%, 60%);
  }
  &.term{
    color:hsl(213.98deg 83.37% 63.34%);
  }
  &.list{
    color:hsl(151.88deg 81.87% 63.63%);
    /* color:hsl(0, 0%, 60%); */
  }
  &.string{
    color:#690;
    background-color: #231926;

    /* color:hsl(180, 75%, 50%); */
    /* color:hsl(240, 100%, 50%); */
  }
  &.comment{
    color:slategray;
    /* color: hsl(30, 10%, 15%) */
  }
  &.number{
    color:#a8aed3;
  }
  &.special{
    color:#e9ce9d;
  }
}
`
function renderAreaCode(child: AreaAtom) {
  renderFragment(function () {
    if (isAreaCode(child)) {
      if (child.type == 'error') {
        useErrorContextProvide(child.errors)
      }
      domOf("span", {
        className: `${child.type} ${child.type == 'rule' && child.cut ? 'cut' : ''}`,
      }).render(function () {
        child.children.forEach(renderAreaCode)
      })
    } else {
      renderLToken(child as LToken)
    }
  })
}

function renderLToken(row: LToken) {
  let cname: string = row.type
  if (row.type == 'block') {
    if (keywords.includes(row.value)) {
      cname = 'keyword'
      if (row.value == '[' || row.value == ']') {
        cname = "list"
      } else if (row.value == '(' || row.value == ')') {
        cname = 'term'
      } else if (row.value == '|') {
        cname = 'keyword'
      }
    } else if (row.value.startsWith('$')) {
      cname = 'special'
    } else if (!isNaN(Number(row.value))) {
      cname = 'number'
    }
  }


  const errors = useErrorContextProvide(row.errors)
  const [hover, setHover] = useChange(false)
  renderIf(hover && errors, function () {
    useEffect(() => {
      const box = tdiv.getBoundingClientRect()
      div.style.bottom = window.innerHeight - box.top + 'px'
      div.style.left = box.left + 'px'
      document.body.append(div)
    }, emptyArray)
    const div = portalDomOf("div", {
      style: `
      position:fixed;
      background:white;
      `
    }).render(function () {
      errors.forEach(error => {
        domOf("div",).renderTextContent(error)
      })
    })
  })
  const tdiv = domOf("span", {
    className: `index${row.begin} ${row.errors.length ? 'error' : ''} token ${cname}`,
    onMouseEnter(event) {
      setHover(true)
    },
    onMouseLeave() {
      setHover(false)
    }
  }).renderInnerHTML(row.value)

}
