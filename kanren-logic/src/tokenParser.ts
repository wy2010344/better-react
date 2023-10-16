
export class Que {
  constructor(
    public readonly content: string,
    //下标
    public readonly i = 0,
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

  protected stepQue(step: number) {
    return new Que(this.content, step)
  }

  toString() {
    return JSON.stringify(this)
  }
}


export class LineCharQue extends Que {
  constructor(
    content: string, i: number = 0,
    //行号,从0开始
    public readonly line = 0,
    //列号,从0开始
    public readonly character = 0
  ) {
    super(content, i)
  }

  protected stepQue(step: number) {
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
    return new LineCharQue(this.content, step, line, character)
  }
}


/**
 * 解析,如果解析成功,返回正数.解析失败,返回负数
 */
export type ParseFun<Q extends Que> = (que: Q) => (Q | void)

export function match<Q extends Que>(...vs: string[]): ParseFun<Q> {
  return function (que) {
    return que.match(vs) as Q | undefined
  }
}

export function matchEnd<Q extends Que>(que: Q) {
  return que.i == que.content.length ? que : undefined
}

export function orMatch(...rules: ParseFun<any>[]) {
  return function <Q extends Que>(que: Q) {
    for (const rule of rules) {
      const end = rule(que)
      if (end) {
        return end
      }
    }
  }
}

export function notMathChar<Q extends Que>(...charCodes: number[]): ParseFun<Q> {
  return function (que) {
    return que.step1(code => !charCodes.includes(code)) as Q | undefined
  }
}

export function andMatch(...rules: ParseFun<any>[]) {
  return function <Q extends Que>(que: Q) {
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

export function manyMatch(rule: ParseFun<any>, min = 0) {
  return function <Q extends Que>(que: Q) {
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

class ParserSuccess<Q extends Que, T>{
  constructor(
    public readonly value: T,
    public readonly end: Q
  ) { }
}
function success<Q extends Que, T>(v: T, que: Q) {
  return new ParserSuccess(v, que)
}


type ParseFunGet<Q extends Que, T> = (que: Q) => (ParserSuccess<Q, T> | void)


type RuleCallback<Q extends Que, T> = (begin: Q, end: Q) => T
export function ruleGet<Q extends Que, T>(
  rule: ParseFun<Q>,
  callback: RuleCallback<Q, T>
): ParseFunGet<Q, T> {
  return function (que) {
    const end = rule(que)
    if (end) {
      return success(callback(que, end), end)
    }
  }
}



export function orRuleGet<Q extends Que, T>(...rules: ParseFunGet<Q, T>[]): ParseFunGet<Q, T> {
  return function (que) {
    for (const rule of rules) {
      const v = rule(que)
      if (v) {
        return v
      }
    }
  }
}

export function manyRuleGet<Q extends Que, T>(rule: ParseFunGet<Q, T>, min = 0): ParseFunGet<Q, T[]> {
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


export const ruleGetString: RuleCallback<Que, string> = function (begin, end) {
  return begin.content.slice(begin.i, end.i)
}


export const whiteList = ' \r\n\t'.split('')

export const whiteSpaceRule = manyMatch(
  orMatch(
    ...whiteList.map(v => match(v))
  ),
  1
)