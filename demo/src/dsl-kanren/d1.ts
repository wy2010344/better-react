
import {
  topRule, all, any, unify,
  query,

  Goal, not, walk,
  list,
  success,
  extendSubsitution,
  pair,
  KVar,
  withVar
} from 'wy-helper/kanren'

function anyVar() {
  return KVar.create()
}
const listContain = topRule((list, value): Goal<any> => {
  return any(
    unify(list, pair(value, anyVar())),
    withVar(V => all(
      unify(list, pair(V._, V.Rest)),
      listContain(V.Rest, value)
    ))
  )
})
const listToSet = topRule((list, set): Goal<any> => {
  return any(
    all(
      unify(list, null),
      unify(set, null)
    ),
    withVar(V => all(
      unify(list, pair(V.H, V.Rest)),
      any(
        all(
          listContain(V.Rest, V.H),
          listToSet(V.Rest, set)
        ),
        all(
          unify(set, pair(V.H, V.Set)),
          not(listContain(V.Rest, V.H)),
          listToSet(V.Rest, V.Set)
        )
      )
    ))
  )
})

const listMap = topRule((list, fun, out): Goal<any> => {
  return any(
    all(
      unify(list, null),
      unify(out, null)
    ),
    withVar(V => all(
      unify(list, pair(V.F, V.Rest)),
      unify(out, pair(V.O, V.ORest)),
      (sub) => {
        const value = walk(V.F, sub)
        const f = walk(fun, sub)
        if (f instanceof Function) {
          const o = (f as any)(value)
          return success(extendSubsitution(V.O, o, sub))
        } else {
          console.log("fail")
          return null
        }
      },
      listMap(V.Rest, fun, V.ORest)
    ))
  )
})

const append = topRule((a, b, c): Goal<any> => {
  return any(
    all(
      unify(a, null),
      unify(b, c)
    ),
    withVar(V => all(
      unify(a, pair(V.A, V.H)),
      unify(c, pair(V.A, V.Y)),
      append(V.H, b, V.Y)
    ))
  )
})




export const [map, goal] = query(V => {
  return listContain(
    list(1, 2, 3, 4, 5, 6),
    6
  )
  // return append(
  //   V.A,
  //   V.B,
  //   list(1, 2, 3, 4, 5, 6)
  // )
  // return listMap(
  //   list(1, 2, 4, 1, 3, 43, 4, 345),
  //   (v: any) => v + 8,
  //   V.M
  // )
  // return listToSet(
  //   list(
  //     1, 1, 1, 3, 2, 3, 2, 4, 5, 6, 34, 2
  //   ),
  //   V.A
  // )
})