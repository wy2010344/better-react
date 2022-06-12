import { useMap, useState } from "better-react";
import { useContent, useDom } from "better-react-dom";
import { useRef } from "better-react-helper";
import { normalPanel } from "../panel/PanelContext";


type Vote = {
  description: string
  creater?: string
  whoVotes: string[]
}
type Topic = {
  date: number
  description: string
  votes: Vote[]
  creater: string
}

export default normalPanel(function (operate, id) {
  const [members, setMembers] = useState<string[]>(["Admin"])
  const [topics, setTopics] = useState<Topic[]>([])
  useDom("button", {
    onClick(e) {
      e.stopPropagation()
      const name = prompt("请输入姓名")?.trim()
      if (name && !members.includes(name)) {
        setMembers([
          name,
          ...members
        ])
      }
    },
    children() {
      useContent("增加人员")
    }
  })
  useDom("div", {
    children() {
      const area = useRef<HTMLTextAreaElement | null>(null)
      useDom("textarea", {
        css: `
        width:100%;
        min-height:1rem;
        border:none;
        padding:0;
        resize:none;
        `,
        onInput(e) {
          const text = area.get()
          if (text) {
            text.style.height = text.scrollHeight + 'px'
          }
        },
        ref(e) {
          area.set(e)
        }
      })
      useDom("button", {
        onClick(e) {
          e.stopPropagation()
          const textarea = area.get()
          const value = textarea?.value.trim()
          if (value && textarea && !topics.find(v => v.description == value)) {
            textarea.value = ''
            setTopics([
              {
                date: Date.now(),
                votes: [],
                creater: "Admin",
                description: value
              },
              ...topics
            ])
          }
        },
        children() {
          useContent("增加话题")
        }
      })
    }
  })

  useMap(topics, v => v.description, function (v, i) {
    useDom("div", {
      css: `
      cursor:pointer;
      `,
      onClick(e) {
        e.stopPropagation()

      },
      children() {
        useContent(v.description)
      }
    })
    useDom("hr")
  })
})