import { createContext, useEffect } from "better-react"
import { useRefValue, ValueCenter } from "better-react-helper"



export type DBStore = {

}

export const dbStore = {
  get<K extends keyof DBStore>(key: K): DBStore[K] | void {
    const value = localStorage.getItem(key)
    if (value) {
      return JSON.parse(value)
    }
  },
  set<K extends keyof DBStore>(key: K, value?: DBStore[K] | void) {
    if (value) {
      localStorage.setItem(key, JSON.stringify(value))
    } else {
      localStorage.removeItem(key)
    }
  }
}

const valueCenter = ValueCenter.of<Partial<DBStore>>({})
export function useStore<K extends keyof DBStore>(key: K) {

  // const value=useRefValue(()=>va)
  // useEffect(()=>{
  //   const notify=(value:Partial<DBStore>)=>{
  //     const partValue=value[key]

  //   }
  //   valueCenter.add(notify)
  //   return ()=>{
  //     valueCenter.remove(notify)
  //   }
  // },[])
  // return [value, function (value?: DBStore[K]) {


  //   newValue = value
  // }] as const
}