import { Connection, DATA_TYPE, ITable } from "jsstore";

const tableTodoName = "todo"
/**
 * 无副作用,需要两张表,一张累积表,一张流水表
 */
let idbCon: Connection
export function buildTodoScheme(connection: Connection, add: (v: ITable) => void) {
  idbCon = connection
  add({
    name: tableTodoName,
    columns: {
      id: {
        primaryKey: true,
        autoIncrement: true
      },
      content: {
        notNull: true,
        dataType: DATA_TYPE.String
      },
      createTime: {
        notNull: true,
        dataType: DATA_TYPE.DateTime
      },
      updateTime: {
        notNull: true,
        dataType: DATA_TYPE.DateTime
      },
      finished: {
        notNull: true,
        dataType: DATA_TYPE.Boolean
      }
    }
  })
}
export type TodoModel = {
  id: number
  content: string
  createTime: Date,
  updateTime: Date
  finished: boolean
}

export const todoService = {
  getAll() {
    return idbCon.select<TodoModel>({
      from: tableTodoName
    })
  },
  async add(content: string) {
    const time = new Date()
    const vs = await idbCon.insert({
      into: tableTodoName,
      values: [{
        content,
        createTime: time,
        updateTime: time,
        finished: false
      }],
      return: true
    }) as any[]
    const v = vs[0] as TodoModel
    return v
  },
  async update(old: TodoModel, {
    content = old.content,
    finished = old.finished
  }: {
    content?: string
    finished?: boolean
  }) {
    const time = new Date()
    const vs = await idbCon.update({
      in: tableTodoName,
      set: {
        content,
        finished,
        updateTime: time
      },
      where: {
        id: old.id
      }
    })
    return {
      ...old,
      content,
      finished,
      updateTime: time
    } as TodoModel
  }
}