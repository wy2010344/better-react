import { useState, useMemo, useStoreTriggerRender } from "better-react-helper"
import { TypeSystemModel } from "./typeSystem/model"
import { ValueCenter, valueCenterOf } from "wy-helper"

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

const current = new Map<DBStoreKEY, ValueCenter<DBStore[DBStoreKEY]>>()
function getNotify<K extends DBStoreKEY>(key: K, defaultValue: DBStore[K]) {
  if (current.has(key)) {
    return current.get(key) as ValueCenter<DBStore[K]>
  }
  const valueStr = localStorage.getItem(key)
  const center = valueCenterOf<DBStore[K]>(valueStr ? JSON.parse(valueStr) : defaultValue)
  center.subscribe(function (v) {
    if (v) {
      localStorage.setItem(key, JSON.stringify(v))
    } else {
      localStorage.removeItem(key)
    }
  })
  current.set(key, center)
  return center
}

export function useStore<K extends DBStoreKEY>(key: K, defaultValue: DBStore[K]) {
  return useMemo(() => getNotify(key, defaultValue), [])
}

const defaultUSER = "Admin"
export function useTopic() {
  const notify = useStore("vote", [])
  const topics = useStoreTriggerRender(notify)
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
  const notify = useStore("user", [
    {
      name: defaultUSER
    }
  ])
  const users = useStoreTriggerRender(notify)
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