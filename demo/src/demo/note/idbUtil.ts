


import * as idb from 'idb'
import { asLazy, batchGetPromise } from 'wy-helper'

/**
 * 仅仅是对indexedDB的IDBRequest进行了promise封装,
 * 需要高性能可以用这个
 * 会比原始api简单一点
 * 
 * 类似的还有easy-idb,
 *  @coderundebug/indexeddb-promise
 *  
 */
export const idbOut = batchGetPromise(async () => {
  return idb.openDB("test-db", 1, {
    upgrade(database, oldVersion, newVersion, transaction, event) {
      const keyValStore = database.createObjectStore("keyval")
      keyValStore.put("world", "hello")
    },
  })
})


export async function initIdb1() {

  const db = await idbOut()
  const tx = db.transaction("keyval")
  const store = tx.objectStore('keyval')
  const v = await store.get("hello")
  console.log("dd", v)


}

export async function initIdb2() {

  const db = await idbOut()
  const tx = db.transaction("keyval", 'readwrite')
  const store = tx.objectStore('keyval')
  await store.put('bar', 'foo')
  const v = await store.get("foo")
  console.log("dd", v)
  await tx.done
  console.log("vs")
}