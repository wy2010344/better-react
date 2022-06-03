import { VSCodeDefineType, VSToken } from './vscode'





export type AstParseFun = (list: VSToken[], i: number) => number


export const astEndRule: AstParseFun = (list, i) => {
	if (list.length == i) {
		return i
	}
	return -1
}


export function astMatch(type: VSCodeDefineType, ...values: string[]): AstParseFun {
	return function (list, i) {
		const row = list[i]
		if (row) {
			for (const value of values) {
				if (row.value == value) {
					row.vstype = type
					return i + 1
				}
			}
		}
		return -1
	}
}

export function astNotMatch(type: VSCodeDefineType, ...values: string[]): AstParseFun {
	return function (list, i) {
		const row = list[i]
		if (row) {
			for (const value of values) {
				if (row.value == value) {
					return -1
				}
			}
			row.vstype = type
			return i + 1
		}
		return -1
	}
}

export function astOrMatch(...rules: AstParseFun[]): AstParseFun {
	return function (list, i) {
		for (const rule of rules) {
			const end = rule(list, i)
			if (end > -1) {
				return end
			}
		}
		return -1
	}
}

export function astAndMatch(...rules: AstParseFun[]): AstParseFun {
	return function (list, i) {
		let last = i
		for (const rule of rules) {
			const nLast = rule(list, last)
			if (nLast < 0) {
				return -1
			}
			last = nLast
		}
		return last
	}
}

export function astManyMatch(rule: AstParseFun, min = 0): AstParseFun {
	return function (list, i) {
		let last = i
		let count = 0
		while (true) {
			const nLast = rule(list, i)
			if (nLast < 0) {
				if (count < min) {
					return -1
				} else {
					return last
				}
			} else {
				count++
				last = nLast
			}
		}
	}
}

class AstParserSuccess<T>{
	constructor(
		public readonly value: T,
		public list: VSToken[],
		public begin: number,
		public end: number
	) { }
}
function success<T>(v: T, list: VSToken[], begin: number, end: number) {
	return new AstParserSuccess(v, list, begin, end)
}
export type AstParseFunGet<T> = (list: VSToken[], i: number) => (AstParserSuccess<T> | void)
type RuleCallback<T> = (list: VSToken[], begin: number, end: number) => T

export function astRuleGet<T>(rule: AstParseFun, callback: RuleCallback<T>): AstParseFunGet<T> {
	return function (list, i) {
		const end = rule(list, i)
		if (end < 0) {
			return
		}
		const data = callback(list, i, end)
		return success(data, list, i, end)
	}
}

export function astDelayRuleGet<T>(get: () => AstParseFunGet<T>): AstParseFunGet<T> {
	return function (list, i) {
		return get()(list, i)
	}
}

export function astOrRuleGet<T>(...rules: AstParseFunGet<T>[]): AstParseFunGet<T> {
	return function (list, i) {
		for (const rule of rules) {
			const v = rule(list, i)
			if (v) {
				return v
			}
		}
	}
}

export function astAndRuleGet<F, A1>(
	rules: [
		AstParseFunGet<A1>,
	],
	callback: (a1: A1) => F
): AstParseFunGet<F>
export function astAndRuleGet<F, A1, A2>(
	rules: [
		AstParseFunGet<A1>,
		AstParseFunGet<A2>,
	],
	callback: (a1: A1, a2: A2) => F
): AstParseFunGet<F>
export function astAndRuleGet<F, A1, A2, A3>(
	rules: [
		AstParseFunGet<A1>,
		AstParseFunGet<A2>,
		AstParseFunGet<A3>,
	],
	callback: (a1: A1, a2: A2, a3: A3) => F
): AstParseFunGet<F>
export function astAndRuleGet<F, A1, A2, A3, A4>(
	rules: [
		AstParseFunGet<A1>,
		AstParseFunGet<A2>,
		AstParseFunGet<A3>,
		AstParseFunGet<A4>,
	],
	callback: (a1: A1, a2: A2, a3: A3, a4: A4) => F
): AstParseFunGet<F>
export function astAndRuleGet<F>(rules: AstParseFunGet<any>[], callback: (...vs: any) => F): AstParseFunGet<F> {
	return function (list, i) {
		const vs: any[] = []
		let last = i
		for (const rule of rules) {
			const nLast = rule(list, last)
			if (nLast) {
				last = nLast.end
				vs.push(nLast.value)
			} else {
				return
			}
		}
		const data = callback.apply(null, vs)
		return success(data, list, i, last)
	}
}

export function astManyRuleGet<T>(rule: AstParseFunGet<T>, min = 0): AstParseFunGet<T[]> {
	return function (list, i) {
		const vs: T[] = []
		let last = i
		while (true) {
			const nLast = rule(list, last)
			if (nLast) {
				vs.push(nLast.value)
				last = nLast.end
			} else {
				if (vs.length < min) {
					return
				}
				return success(vs, list, i, last)
			}
		}
	}
}