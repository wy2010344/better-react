import { Range } from "./vscode"
export class Que {
  constructor(
    public readonly content: string,
    //下标
    public readonly i = 0,
    //行号,从0开始
    public readonly line = 0,
    //列号,从0开始
    public readonly character = 0
  ) { }

  match(vs: string[]) {
    for (const v of vs) {
      if (this.content.startsWith(v, this.i)) {
        return this.stepQue(this.i + v.length)
      }
    }
  }
  step1(callback: (v: number) => boolean) {
    if (this.i < this.content.length) {
      if (callback(this.content.charCodeAt(this.i))) {
        return this.stepQue(this.i + 1)
      }
    }
  }

  private stepQue(step: number) {
    let line = this.line
    let character = this.character
    for (let x = this.i; x < step; x++) {
      if (this.content[x] == '\n') {
        ++line
        character = 0
      } else {
        ++character
      }
    }
    return new Que(this.content, step, line, character)
  }

  toString() {
    return JSON.stringify(this)
  }
}


/**
 * 解析,如果解析成功,返回正数.解析失败,返回负数
 */
export type ParseFun = (que: Que) => (Que | void)

export function match(...vs: string[]): ParseFun {
  return function (que) {
    return que.match(vs)
  }
}

export function orMatch(...rules: ParseFun[]): ParseFun {
  return function (que) {
    for (const rule of rules) {
      const end = rule(que)
      if (end) {
        return end
      }
    }
  }
}

export function notMathChar(...charCodes: number[]): ParseFun {
  return function (que) {
    return que.step1(code => !charCodes.includes(code))
  }
}

export function andMatch(...rules: ParseFun[]): ParseFun {
  return function (que) {
    let last = que
    for (const rule of rules) {
      const nlast = rule(last)
      if (nlast) {
        last = nlast
      } else {
        return
      }
    }
    return last
  }
}

export function manyMatch(rule: ParseFun, min = 0): ParseFun {
  return function (que) {
    let last = que
    let count = 0
    while (true) {
      const nlast = rule(last)
      if (nlast) {
        count++
        last = nlast
      } else {
        if (count < min) {
          return
        }
        return last
      }
    }
  }
}

class ParserSuccess<T>{
  constructor(
    public readonly value: T,
    public readonly end: Que
  ) { }
}
function success<T>(v: T, que: Que) {
  return new ParserSuccess(v, que)
}


type ParseFunGet<T> = (que: Que) => (ParserSuccess<T> | void)


type RuleCallback<T> = (begin: Que, end: Que) => T
export function ruleGet<T>(
  rule: ParseFun,
  callback: RuleCallback<T>
): ParseFunGet<T> {
  return function (que) {
    const end = rule(que)
    if (end) {
      return success(callback(que, end), end)
    }
  }
}



export function orRuleGet<T>(...rules: ParseFunGet<T>[]): ParseFunGet<T> {
  return function (que) {
    for (const rule of rules) {
      const v = rule(que)
      if (v) {
        return v
      }
    }
  }
}

export function manyRuleGet<T>(rule: ParseFunGet<T>, min = 0): ParseFunGet<T[]> {
  return function (que) {
    const vs: T[] = []
    let last = que
    while (true) {
      const nlast = rule(last)
      if (nlast) {
        last = nlast.end
        vs.push(nlast.value)
      } else {
        if (vs.length < min) {
          return
        }
        return success(vs, last)
      }
    }
  }
}


export const ruleGetString: RuleCallback<string> = function (begin, end) {
  return begin.content.slice(begin.i, end.i)
}


export function getRange(begin: Que, end: Que): Range {
  return {
    start: {
      line: begin.line,
      character: begin.character
    },
    end: {
      line: end.line,
      character: end.character
    }
  }
}

export const whiteList = ' \r\n\t'.split('')

export const whiteSpaceRule = manyMatch(
  orMatch(
    ...whiteList.map(v => match(v))
  ),
  1
)
