import { AtomExp, ErrorArea, LExp, LRule } from "./parse"
import { LToken } from "./tokenize"


export type AreaAtom = AreaCode | LToken
export type AreaCode = {
  type: "and" | "or" | "rule" | "list"
  cut?: boolean
  begin: number
  end: number
  children: AreaAtom[]
} | AreaCodeError
type AreaCodeError = {
  type: "error"
  begin: number
  end: number
  errors: string[]
  children: (LToken | AreaCode)[]
}

const areaCodeTypes = ["and", "or", "rule", "list", "error"]
export function isAreaCode(v: AreaAtom): v is AreaCode {
  return areaCodeTypes.includes(v.type)
}

export function buildViewPairs(
  tokens: LToken[],
  buildContent: (areaCode: AreaCode[]) => void,
  errorAreas: ErrorArea[],
) {
  const areaCodes: AreaCode[] = []
  errorAreas.forEach(ea => {
    let old: AreaCodeError = areaCodes.find(v => v.type == 'error' && (v.begin == ea.begin || v.end == ea.end)) as AreaCodeError
    if (!old) {
      old = {
        type: "error",
        begin: ea.begin,
        end: ea.end,
        errors: [],
        children: []
      } as AreaCodeError
      areaCodes.push(old)
    }
    old.errors.push(ea.error)
  })
  buildContent(areaCodes)
  const cacheTokens: LToken[] = []
  for (const token of tokens) {
    const acs = areaCodes.filter(x => x.begin <= token.begin && x.end >= token.end).sort(sortAreaCodeAsc)
    const ac = acs[0]
    if (ac) {
      ac.children.push(token)
    } else {
      cacheTokens.push(token)
    }
  }
  const cacheAreaCodes: AreaCode[] = []
  for (const ac of areaCodes) {
    const acs = areaCodes.filter(x => x.begin <= ac.begin && x.end >= ac.end).sort(sortAreaCodeAsc)
    const pac = findNotInclude(acs, ac)
    if (pac) {
      //找到更大的范围
      pac.children.push(ac)
    } else {
      //没有更大的范围
      cacheAreaCodes.push(ac)
    }
  }
  const newList: AreaAtom[] = sortAreaCode([...cacheTokens, ...cacheAreaCodes])

  return newList
}

function sortAreaCodeAsc(a: AreaCode, b: AreaCode) {
  return (a.end - a.begin) - (b.end - b.begin)
}

function checkInclude(ac: AreaCode, pac: AreaCode) {
  if (ac == pac) {
    return true
  }
  for (const child of ac.children) {
    if (isAreaCode(child)) {
      const has = checkInclude(child, pac)
      if (has) {
        return true
      }
    }
  }
  return false
}
function findNotInclude(acs: AreaCode[], ac: AreaCode) {
  for (const pac of acs) {
    if (!checkInclude(ac, pac)) {
      return pac
    }
  }
}
function sortAreaCode(acs: AreaAtom[]) {
  acs.forEach(child => {
    if (isAreaCode(child)) {
      sortAreaCode(child.children)
    }
  })
  acs.sort((a, b) => {
    return a.begin - b.begin
  })
  return acs
}

export function getAreaList(rules: LRule[], areaCodes: AreaCode[]) {
  rules.forEach(rule => {
    areaCodes.push({
      type: "rule",
      cut: rule.isCut,
      begin: rule.begin,
      end: rule.end,
      children: []
    })
    buildExp(rule.head, areaCodes)
    if (rule.body) {
      buildExp(rule.body, areaCodes)
    }
  })
}

function buildPairs(list: AtomExp[], areaCodes: AreaCode[], flagExp: LExp) {
  areaCodes.push({
    type: "list",
    begin: flagExp.begin,
    end: flagExp.end,
    children: []
  })
  list.forEach(row => {
    buildExp(row, areaCodes)
  })
}

export function buildExp(body: LExp, areaCodes: AreaCode[], flagExp = body) {
  if (body.type == 'and' || body.type == 'or') {
    areaCodes.push({
      cut: body.type == 'or' && body.isCut ? true : false,
      type: body.type,
      begin: flagExp.begin,
      end: flagExp.end,
      children: []
    })
    buildExp(body.left, areaCodes)
    buildExp(body.right, areaCodes)
  } else {
    if (body.type == "[]") {
      buildPairs(body.children, areaCodes, body)
    }
  }
}
