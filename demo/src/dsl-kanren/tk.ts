import { query1, seriesNot, topFun, parallel, add, unify, pair, list, walk, extendSubsitution, success } from "wy-helper/kanren";





const listContain = topFun((V, list, value) => {
  parallel(
    () => {
      add(unify(list, pair(value, V._)))
    },
    () => {
      add(unify(list, pair(V._, V.Rest)))
      listContain(V.Rest, value)
    }
  )
})


const append = topFun((V, a, b, c) => {
  parallel(
    () => {
      add(unify(a, null))
      add(unify(b, c))
    },
    () => {
      add(unify(a, pair(V.A, V.H)))
      add(unify(c, pair(V.A, V.Y)))
      append(V.H, b, V.Y)
    }
  )
})

const listToSet = topFun((V, list, set) => {
  parallel(
    () => {
      add(unify(list, null))
      add(unify(set, null))
    },
    () => {
      add(unify(list, pair(V.H, V.Rest)))
      parallel(
        () => {
          listContain(V.Rest, V.H)
          listToSet(V.Rest, set)
        },
        () => {
          add(unify(set, pair(V.H, V.Set)))
          seriesNot(() => {
            listContain(V.Rest, V.H)
          })
          listToSet(V.Rest, V.Set)
        }
      )
    }
  )
})


const listMap = topFun((V, list, fun, out) => {
  parallel(
    () => {
      add(unify(list, null))
      add(unify(out, null))
    },
    () => {
      add(unify(list, pair(V.F, V.Rest)))
      add(unify(out, pair(V.O, V.ORest)))
      add(sub => {
        const value = walk(V.F, sub)
        const f = walk(fun, sub)
        if (f instanceof Function) {
          const o = (f as any)(value)
          return success(extendSubsitution(V.O, o, sub))
        } else {
          console.log("fail")
          return null
        }
      })
      listMap(V.Rest, fun, V.ORest)
    }
  )
})

export const [map, stream] = query1((V) => {
  // listContain(
  //   list(1, 2, 3, 4, 5, 6),
  //   9
  // )
  listMap(
    list(1, 2, 4, 1, 3, 43, 4, 345),
    (v: any) => v + 8,
    V.M
  )
  // listToSet(
  //   list(
  //     1, 1, 1, 3, 2, 3, 2, 4, 5, 6, 34, 2
  //   ),
  //   V.A
  // )
  // append(
  //   V.A,
  //   V.B,
  //   list(1, 2, 3, 4, 5, 6)
  // )
})