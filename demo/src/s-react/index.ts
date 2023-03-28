import { useEffect } from "better-react"
import { normalPanel } from "../panel/PanelContext"
import { mergeTree, parseTree, tokenize } from "./tokenize"

export default normalPanel(function (operate) {
  useEffect(() => {
    try {

      const list = tokenize(`
Todo:(@struct
  id:number
  content: String
  finish: Boolean
  createTime: Date
)

todoIdx:(@var 0)

TodoApp:(@component 
  list:(State (List))
  value:(State '')
  (View
    align-items:"center"  
    children:(@component  
      (Input 
        value:value.value
        onChange:(@event-arg e
          (value.set e.target.value)  
        ))
      (Button text:"+" onClick:(@event
        (list.set
          (@fun-arg oldList
            newIdx:(+ (todoIdx) 1) 
            (todoIdx newIdx)
            (oldList.concat 
              (Todo 
                id:newIdx
                content:e.target.value
                finish:false
                createTime:(Date)))))))))
  (Map list.value 
    (@fun v v.id) \`这是一个computed属性\`
    (@component-arg e 
      \`setRow是一种Event事件\`
      setRow:(BuildSubSet list.set (@event-arg v (== v.id e.id)))
      (View 
        justify-content:"space-between"
        align-items:"center"
        children:(@component
         (Text content:e.content)
         (Checkbox checked:e.finish onToggle:(@event
           (setRow (@fun-arg old 
              (Todo ~old finished:!old.finished)))))
         (Button text:"X" onClick:(@event
          (setRow))))))))
    `)
      console.log(list)
      const tree = parseTree(list)
      console.log(tree)
      const mList = mergeTree(tree)
      console.log("m-list", mList)
    } catch (err) {
      console.error(err)
    }
  }, [])


})