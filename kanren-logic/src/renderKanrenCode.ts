import { React, dom } from "better-react-dom";
import { renderFragment, renderIf, useAtom, useAttrEffect, useChange, useChgAtom, useEffect, useMemo, useVersionLock, valueCenterOf } from "better-react-helper";
import { ContentEditableModel, contentDelete, contentEnter, contentTab, getCurrentRecord, useContentEditable } from "better-react-dom-helper";
import { mb, observeCssmap } from "better-react-dom-helper";
import { LToken, keywords, tokenize } from "./tokenize";
import { emptyArray } from "better-react";
import { parseNewQuery, parseNewRule, parseQuery, parseRules, pserNewRules } from "./parse";
import { useCss } from "better-react-dom-helper";
import { useErrorContextProvide } from "./errorContext";
import { AreaAtom, buildViewPairs, isAreaCode } from "./buildViewPairs";
import { useRenderCode } from "./renderCode";

type ColorWithBack = {
  background?: string
  color?: string
}
export type CodeProps = {
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

export function useRenderKanrenCode<T>(
  init: T,
  initFun: (v: T) => ContentEditableModel
) {
  const { renderContent, ...args } = useRenderCode(init, initFun)
  return {
    ...args,
    renderContent(
      list: AreaAtom[],
      props?: React.HTMLAttributes<HTMLDivElement> & {
        readonly?: boolean
        getBackgroundColor?: (v: number) => string
      }
    ) {

      renderContent({
        ...props,
        className: `${props?.className} ${kanrenClassName}`
      }, function () {

        list.forEach(function (child) {
          renderAreaCode(child, 0, props?.getBackgroundColor)
        })
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




export const kanrenCodeColors = valueCenterOf<CodeProps>({})

const [kanrenClassName] = observeCssmap([kanrenCodeColors], function ([define]) {
  return `
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
  line-height: 100%;
  ${Object.entries(defineColors).map(function ([key, color]) {
    color = define?.themeColors?.[key as keyof ThemeColors] || color
    return `
    &.${key}{
      ${color?.color && `color:${color.color};`}
      ${color?.background && `background:${color.background};`}
    }
    `
  }).join('\n')}
}
`})