
Todo:(@struct
  id:number
  content: String
  finish: Boolean
  createTime: Date
)

todoIdx:(@var 0)

TodoApp:(@component 
  (list setList):(State (List))
  (value setValue):(State '')
  (View
    align-items:"center"  
    children:(@component  
      (Input 
        value:value
        onChange:(@event-arg e
          (setValue e.target.value)  
        ))
      (Button text:"+" onClick:(@event
        (setList
          (@fun-arg oldList
            newIdx:(+ (todoIdx) 1) 
            (todoIdx newIdx)
            (oldList.concat 
              (Todo 
                id:newIdx
                content:e.target.value
                finish:false
                createTime:(Date)))))))))
  (Map list 
    (@fun v v.id) 
    (@component-arg e 
      `setRow是一种Event事件`
      setRow:(BuildSubSet setList (@event-arg v (== v.id e.id)))
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