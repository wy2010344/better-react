import Dexie from "dexie";

/**
 * Dexi的查询很便利,让人忽略细节
 * 
 * 还有一个liveQuery的api,是自己实现的监听,简化mvc从数据库获得实时数据
 *  其依赖性统计,应该类似于vue
 * 
 * 这是类似mongodb的api,
 *  其它相似:minimongo/Localbase(非ts,firebase风格,建立在LocalForage上)
 * https://www.youtube.com/watch?v=KJnupY2HPCg&t=1726s
 */
const db = new Dexie("FriendDatabase")

db.version(1).stores({
  friends: `
  id,name,age
  `
})

type FriendTable = {
  id: number
  name: string
  age: number
}
export async function initDexieUtil() {
  const fTable = db.table<FriendTable, number>("friends")
  db.on("populate")
  try {
    await fTable.bulkPut([
      { id: 1, name: "Josephine", age: 21 },
      { id: 2, name: "Per", age: 75 },
      { id: 3, name: "Simon", age: 5 },
      { id: 4, name: "Sara", age: 50, notIndexedProperty: 'foo' } as any
    ])

    const fs1 = await fTable.where("age").between(0, 25).toArray()

    console.log("找到朋友1", fs1)

    const fs2 = await fTable.orderBy("age").reverse().toArray()
    console.log("找到朋友2", fs2)

    const f3 = await fTable.where("name").startsWith("S").keys()
    console.log("以S开头的名字", f3)
  } catch (err) {
    console.log("Ouch..." + err)
  }

}