import { React, dom } from "better-react-dom";
import { renderFragment, renderIf, useAtom, useChange, useChgAtom, useEffect, useMemo, useVersionLock } from "better-react-helper";
import { ContentEditableModel, contentDelete, contentEnter, contentTab, getCurrentRecord, useContentEditable } from "better-react-dom-helper";
import { mb } from "better-react-dom-helper";
import { LToken, keywords, tokenize } from "./tokenize";
import { emptyArray } from "better-react";
import { parseNewQuery, parseNewRule, parseQuery, parseRules, pserNewRules } from "./parse";
import { useCss } from "better-react-dom-helper";
import { useErrorContextProvide } from "./errorContext";
import { AreaAtom, buildViewPairs, isAreaCode } from "./buildViewPairs";

type ColorWithBack = {
  background?: string
  color?: string
}
export type CodeProps = React.HTMLAttributes<HTMLDivElement> & {
  css?: string
  readonly?: boolean

  themeColors?: ThemeColors
  getBackgroundColor?(v: number): string
}

export type ThemeColors = {
  list?: ColorWithBack
  term?: ColorWithBack
  keyword?: ColorWithBack
  special?: ColorWithBack
  number?: ColorWithBack
  comment?: ColorWithBack
  string?: ColorWithBack
  var?: ColorWithBack
  block?: ColorWithBack
}
export const defineColors: ThemeColors = {
  var: {
    color: "hsl(40, 90%, 60%)",
    background: "#231926"
  },
  block: {
    color: "hsl(0, 0%, 70%)",
    background: "#231926"
  },
  keyword: {
    color: "hsl(75, 70%, 60%)"
  },
  term: {
    color: "hsl(213.98deg 83.37% 63.34%)"
  },
  list: {
    color: "hsl(151.88deg 81.87% 63.63%)"
  },
  string: {
    color: "#690",
    background: "#231926"
  },
  comment: {
    color: "slategray"
  },
  number: {
    color: "#a8aed3"
  },
  special: {
    color: "#e9ce9d"
  }
}

export function useRenderCode<T>(
  init: T,
  initFun: (v: T) => ContentEditableModel
) {
  const { value, dispatch, current, renderContentEditable } = useContentEditable(init, initFun)
  const editorRef = useChgAtom<HTMLDivElement | undefined>(undefined)
  return {
    value,
    current,
    dispatch,
    getEditor() {
      return editorRef.get()
    },
    renderContent(
      list: AreaAtom[],
      props?: CodeProps
    ) {
      renderContentEditable({
        readonly: props?.readonly
      }, function () {
        const className = useCss`
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
${props?.css}
.token{
  margin-inline:0.1em;
  line-height: 100%;
  ${Object.entries(defineColors).map(function ([key, color]) {
          color = props?.themeColors?.[key as keyof ThemeColors] || color
          return `
    &.${key}{
      ${color?.color && `color:${color.color};`}
      ${color?.background && `background:${color.background};`}
    }
    `
        }).join('\n')}
}
`
        const div = dom.div({
          ...props,
          spellcheck: false,
          className: `${props?.className || ''}  ${className}`,
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
          list.forEach(function (child) {
            renderAreaCode(child, 0, props?.getBackgroundColor)
          })
        })
        useMemo(() => {
          editorRef.set(div)
        }, emptyArray)
        return div
      })
    }
  }
}
export function useKRules(value: string) {
  return useMemo(() => {
    const tokens = tokenize(value)
    const { errorAreas, rules, asts } = parseRules(tokens)
    return {
      list: buildViewPairs(tokens, asts, errorAreas),
      rules
    }
  }, [value])
}
export function useKQuery(value: string) {
  return useMemo(() => {
    const tokens = tokenize(value)
    const { errorAreas, query, asts } = parseQuery(tokens)
    return {
      list: buildViewPairs(tokens, asts, errorAreas),
      query
    }
  }, [value])
}

export function useKNewQuery(value: string) {
  return useMemo(() => {
    const tokens = tokenize(value)
    const { errorAreas, query, ast } = parseNewQuery(tokens)
    return {
      list: buildViewPairs(tokens, ast ? [ast] : [], errorAreas),
      query
    }
  }, [value])
}

export function useGetNew<T>(getCache: () => T, deps?: any[]) {
  const [getVersion, updateVersion] = useVersionLock(1)
  const cacheRulesRef = useAtom<{
    version: number,
    cache: T
  } | undefined>(undefined)
  useEffect(() => {
    updateVersion()
  }, deps)
  return function () {
    const version = getVersion()
    if (cacheRulesRef.get()?.version == version) {
      return cacheRulesRef.get()?.cache!
    }
    const cache = getCache()
    cacheRulesRef.set({
      version,
      cache
    })
    return cache
  }
}

export function useKNewRule(value: string) {
  return useMemo(() => {
    const tokens = tokenize(value)
    const { errorAreas, rule, asts } = parseNewRule(tokens)
    return {
      list: buildViewPairs(tokens, asts, errorAreas),
      rule
    }
  }, [value])
}

export function useKNewRules(value: string) {
  return useMemo(() => {
    const tokens = tokenize(value)
    const { rules, errorAreas, asts } = pserNewRules(tokens)
    return {
      list: buildViewPairs(tokens, asts, errorAreas),
      rules
    }
  }, [value])
}

function isCtrl(e: React.KeyboardEvent) {
  return e.metaKey || e.ctrlKey
}

function renderAreaCode(child: AreaAtom, i: number, getBackgroundColor?: (v: number) => string) {
  renderFragment(function () {
    if (isAreaCode(child)) {
      if (child.type == 'error') {
        useErrorContextProvide(child.errors)
      }
      dom.span({
        className: `${child.type} ${child.type != 'error' && 'bracket'} ${child.type == 'rule' && child.cut ? 'cut' : ''}`,
        style: `
        background:${getBackgroundColor?.(i)};
        `
      }).render(function () {
        child.children.forEach(function (child) {
          renderAreaCode(child, i + 1, getBackgroundColor)
        })
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

  if (row.value.includes('\n')) {
    cname += ' pre-wrap'
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
    const div = dom.div({
      style: `
      position:fixed;
      background:white;
      `
    }).asPortal().render(function () {
      errors.forEach(error => {
        dom.div().renderTextContent(error)
      })
    })
  })
  const tdiv = dom.span({
    className: `index${row.begin} ${row.errors.length ? 'error' : ''} token ${cname}`,
    onMouseEnter(event) {
      setHover(true)
    },
    onMouseLeave() {
      setHover(false)
    }
  }).renderInnerHTML(row.value)

}
