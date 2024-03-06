import { renderContent, useDom } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";
import { initJsStore } from "../jsStore";
import { todoService } from "../jsStore/todo";

export default normalPanel(function (operate, id) {

  useDom("div", {
    children() {
      dom.button({
        onClick() {
        },
        textContent: "增加",
      })
      dom.button({
        onClick() {
        },
        children() {
          renderContent("查询")
        }
      })
      dom.button({
        async onClick() {
          const items = await navigator.clipboard.read()
          if (items && items.length) {
            // 检索剪切板items
            for (var i = 0; i < items.length; i++) {
              const item = items[i]
              console.log(item)
              for (let type of item.types) {
                const d = await item.getType(type)
                console.log(d, await d.text())
              }
              // if (items[i].type.indexOf('image') !== -1) {
              //   file = items[i].getAsFile();
              //   break;
              // }
            }
          }
        },
        children() {
          renderContent("粘贴查看")
        }
      })
    }
  })
})

/***
 * indexDB学习
 * https://www.ruanyifeng.com/blog/2018/07/indexeddb.html
 * https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API/Using_IndexedDB
 * https://juejin.cn/post/6844903570005835789
 * https://www.51cto.com/article/706896.html
 * https://blog.csdn.net/w157z0372x5580/article/details/76637723
 * http://echizen.github.io/tech/2018/06-23-indexdb
 * 
 * 创建索引
 * 
 * 一个事务,可能涉及多个表
 *  - 事务中对某个表的操作
 *  - get(key:索引)
 *  - put(value:any) 增加数据,仍然应该是promise的
 *  - delete(key:索引)
 * 
 * 指定索引查询
 * const index=store.index("name")
 * index.openCursor(range)
 * 
 * index.openKeyCursor()与普通游标的区别:普通带有value,键只带有key,直接去获得数据
 * 
 * 范围查询 IDBKeyRange
  * lowerBound方法：指定范围的下限。IDBKeyRange.upperBound(x)
  * upperBound方法：指定范围的上限。IDBKeyRange.lowerBound(x)
  * bound方法：指定范围的上下限。
  * only方法：指定范围中只有一个值。
  * 
  * 
  * key值可为 number/data/string/binary/array
  * keyPath只能是 Blob File Array String(非空格)
  * value能够接受ECMA-262中所有的类型的值，例如String，Date，ImageDate等。
  * 
 * 
 * 封装 localforage
 */