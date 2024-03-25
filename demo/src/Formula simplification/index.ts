/**
 * 

equal(A * B,A * B).
equal(A * B,B * A).
equal(A + B,A + B).
equal(A + B,B + A).
equal(X,X*1).
simplify(KK,A * (X + Y)):-
    equal(KK,M + N),
    simplify(M,W),
    equal(W,A * X),
    simplify(N,Z),
    equal(Z,A * Y).

simplify(X / Y,Z):-
    simplify(X,DX),
    simplify(Y,DY),
    equal(DX,A * B),
    equal(DY,A * C),
    simplify(B / C,Z).
%simplify((X + Y) / M,Z):-equal(X, A * X1),equal(Y, A * Y1),simplify((A * (X1 + Y1)) / M,Z).
simplify(X,X).

%equal(W * M,K + L):- equal(M,A + B),equal(K,W * A),equal(L,W * B).
%equal(K + L,W * M):- equal(W * M,K + L).

%equal(A * (X + Y),(A * X) + (A * Y)).
 */


/**
 * 可交换群
 * 加法,乘法
 */
export abstract class ExchangeableSet {
  public readonly list: Exp[] = []

}

//带下标的符号
class SymbolWithSub {
  constructor(
    public readonly symbol: string,
    public readonly sub: string
  ) { }

  equal(a: any) {
    if (a == this) {
      return true
    }
    if (a instanceof SymbolWithSub) {
      return a.symbol == this.symbol && a.sub == this.sub
    }
    return false
  }
}

export type Exp = Mul | Sum | Div | Sub | number | string | SymbolWithSub

export class Mul extends ExchangeableSet {
}

export class Sum extends ExchangeableSet {

  sumpify() {
    for (const exp of this.list) {
    }
  }

}

export class Div {


}

export class Sub {

}