import { Connection, IDataBase, ITable } from "jsstore";
import jsstoreWorker from 'jsstore/dist/jsstore.worker.min.js?worker'
import { buildTodoScheme } from "./todo";
export const idbCon = new Connection(new jsstoreWorker());
const dbname = 'demo'
function getDatabase() {
  const dataBase: IDataBase = {
    name: dbname,
    version: 1,
    tables: []
  }
  function add(table: ITable) {
    dataBase.tables.push(table)
  }
  buildTodoScheme(idbCon, add)
  return dataBase
}

export async function initJsStore() {
  try {
    const dataBase = getDatabase()
    const isDbCreated = await idbCon.initDb(dataBase);
    if (isDbCreated) {
      console.log('db created');
    }
    else {
      console.log('db opened');
    }
  } catch (ex) {
    console.error(ex)
  }
}