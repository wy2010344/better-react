import { ChangeAtomValue, createChangeAtom, createContext, useEffect, useMemo } from "better-react"
import { useState } from "better-react-helper"
import { TypeSystemModel } from "./typeSystem/model"

export type UserModel = {
  name: string
  color?: string
}
export type TopicModel = {
  date: number
  description: string
  creater: string
  votes: Vote[]
}
export type Vote = {
  description: string
  creater?: string
  whoVotes: string[]
}
export type DBStore = {
  user: UserModel[]
  vote: TopicModel[]
  typeSystem: TypeSystemModel[]
}

type DBStoreKEY = keyof DBStore

class NotifyCenter<T> {
  center: ChangeAtomValue<T>
  pool = new Set<NOTIFY_FUN>()
  constructor(key: string, defaultValue: T) {
    const valueStr = localStorage.getItem(key)
    this.center = createChangeAtom(valueStr ? JSON.parse(valueStr) : defaultValue, (v) => {
      if (v) {
        localStorage.setItem(key, JSON.stringify(v))
      } else {
        localStorage.removeItem(key)
      }
    })
  }
  get() {
    return this.center.get()
  }
  set(v: T) {
    this.center.set(v)
    this.pool.forEach(run => run())
  }
  subscriber(fun: () => void) {
    this.pool.add(fun)
    return () => {
      this.pool.delete(fun)
    }
  }
}

const current = new Map<DBStoreKEY, NotifyCenter<DBStore[DBStoreKEY]>>()
type NOTIFY_FUN = () => void
function getNotify<K extends DBStoreKEY>(key: K, defaultValue: DBStore[K]) {
  if (current.has(key)) {
    return current.get(key) as NotifyCenter<DBStore[K]>
  }
  const center = new NotifyCenter(key, defaultValue)
  current.set(key, center)
  return center
}

export function useStore<K extends DBStoreKEY>(key: K, defaultValue: DBStore[K]) {
  const notify = useMemo(() => getNotify(key, defaultValue), [])
  return {
    notify,
    useValue() {
      const [value, setValue] = useState<DBStore[K]>(() => notify.get())
      useEffect(() => {
        return notify.subscriber(() => {
          setValue(notify.get())
        })
      })
      return value
    }
  }
}

const defaultUSER = "Admin"
export function useTopic() {
  const { notify, useValue } = useStore("vote", [])
  const topics = useValue()
  return {
    topics,
    update(v: TopicModel, i: number) {
      const vs = notify.get().slice()
      vs.splice(i, 1, v)
      notify.set(vs)
    },
    add(content: string) {
      content = content.trim()
      if (topics.find(v => v.description == content)) {
        return '存在相同的主题'
      }
      notify.set([
        {
          date: Date.now(),
          votes: [],
          creater: defaultUSER,
          description: content
        },
        ...notify.get()
      ])
    }
  }
}

export function useUser() {
  const { notify, useValue } = useStore("user", [
    {
      name: defaultUSER
    }
  ])
  const users = useValue()
  return {
    users,
    add(name: string) {
      if (users.find(v => v.name == name)) {
        return "存在相同用户"
      }
      notify.set([
        {
          name
        },
        ...users
      ])
    },
    update(name: string, option: Partial<UserModel>) {
      notify.set(users.map(user => {
        if (user.name == name) {
          return {
            ...user,
            ...option
          }
        }
        return user
      }))
    }
  }
}