import { useStore } from "../dbStore";


type BaseType = "string" | "number" | "nil"
export type AllType = BaseType | TypeModel

export type SubStructTypeModel = {
  type: "struct"
  fields: {
    [key: string]: string[]
  }
}
type SubTypeModel = SubStructTypeModel
type TypeModel = {
  metaType: "type"
  name: string
  value: SubTypeModel
}

type ValueModel = {
  metaType: "value"
  name: string
}
export type TypeSystemModel = TypeModel | ValueModel


function equalRow(a: TypeSystemModel, b: TypeSystemModel) {
  return a.metaType == b.metaType && a.name == b.name
}
export function useTypeDB() {
  const { notify, useValue } = useStore("typeSystem", [])
  const list = useValue()
  function checkExist(metaType: "type" | "value", name: string) {
    if (list.find(x => x.metaType == metaType && x.name == name)) {
      return true
    }
    return false
  }
  return {
    list,
    checkExist,
    add(v: TypeSystemModel) {
      if (checkExist(v.metaType, v.name)) {
        return "存在重复的类型"
      }
      notify.set([v].concat(list))
    },
    update<T extends TypeSystemModel>(v: T, newV: Partial<T>) {
      notify.set(list.map(row => {
        if (equalRow(v, row)) {
          return {
            ...row,
            ...newV
          }
        }
        return row
      }))
    }
  }
}