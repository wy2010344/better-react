import { createContext, useEffect, useMemo, useState } from "better-react"
import { useEvent } from "better-react-helper"

export type UserModel = {
  name: string
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
export type DBStore = Partial<{
  user: UserModel[]
  vote: TopicModel[]
}>

type DBStoreKEY = keyof DBStore

export const dbStore = {
  get<K extends keyof DBStore>(key: K): DBStore[K] {
    const value = localStorage.getItem(key)
    if (value) {
      return JSON.parse(value)
    }
  },
  set<K extends keyof DBStore>(key: K, value: DBStore[K]) {
    if (value) {
      localStorage.setItem(key, JSON.stringify(value))
    } else {
      localStorage.removeItem(key)
    }
  }
}

const draft = new Map<DBStoreKEY, DBStore[DBStoreKEY]>()
const current = new Map<DBStoreKEY, DBStore[DBStoreKEY]>()
type NOTIFY_FUN = () => void
const pool = new Set<NOTIFY_FUN>()
const valueCenter = {
  get<K extends DBStoreKEY>(key: K) {
    if (draft.has(key)) {
      return draft.get(key)
    }
    if (current.has(key)) {
      return current.get(key)
    }
    const valueStr = localStorage.getItem(key)
    if (valueStr) {
      const value = JSON.parse(valueStr)
      current.set(key, value)
      return value
    }
  },
  set<K extends DBStoreKEY>(key: K, value: DBStore[K]) {
    draft.set(key, value)
  },
  commit() {
    draft.forEach((value, key) => {
      current.set(key, value)
      localStorage.setItem(key, JSON.stringify(value))
    })
    draft.clear()
  },
  add(fun: () => void) {
    pool.add(fun)
  },
  remove(fun: () => void) {
    pool.delete(fun)
  }
}

function useStore<K extends DBStoreKEY>(key: K) {
  const [value, setValue] = useState<DBStore[K] | undefined>(() => valueCenter.get(key))
  const notify = useEvent(() => {
    const newValue = valueCenter.get(key)
    if (newValue != value) {
      setValue(newValue)
    }
  })
  useEffect(() => {
    valueCenter.add(notify)
    return () => {
      valueCenter.remove(notify)
    }
  }, [])
  const set = useMemo(() => function (v: DBStore[K], callback?: () => void) {
    valueCenter.set(key, v)
    setValue(v, () => {
      valueCenter.commit()
      if (callback) {
        callback()
      }
    })
  }, [])
  return [value, set] as const
}

const defaultUSER = "Admin"
export function useTopic() {
  const [initTopics, setTopics] = useStore("vote")
  const topics = initTopics || []
  return {
    topics,
    add(content: string) {
      content = content.trim()
      if (topics.find(v => v.description == content)) {
        return '存在相同的主题'
      }
      setTopics([
        {
          date: Date.now(),
          votes: [],
          creater: defaultUSER,
          description: content
        },
      ])
    }
  }
}
export function useUser() {
  const [initUsers, setUsers] = useStore("user")
  const users = initUsers || [{
    name: defaultUSER
  }]
  return {
    users,
    add(name: string) {
      if (users.find(v => v.name == name)) {
        return "存在相同用户"
      }
      setUsers([
        {
          name
        },
        ...users
      ])
    }
  }
}