import { useMap, useState } from "better-react";
import { useContent, useDom } from "better-react-dom";
import { useRef } from "better-react-helper";
import { useTopic } from "../dbStore";
import { normalPanel } from "../panel/PanelContext";
import topicPanel from "./topic";


export default normalPanel(function (operate, id) {
  const topic = useTopic()
  useDom("div", {
    children() {
      const area = useRef<HTMLTextAreaElement | undefined>(undefined)
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
        ref: area.set
      })
      useDom("button", {
        onClick(e) {
          e.stopPropagation()
          const textarea = area.get()
          const value = textarea?.value.trim()
          if (value && textarea) {
            const error = topic.add(value)
            if (error) {
              alert(error)
              return
            }
            textarea.value = ''
          }
        },
        children() {
          useContent("增加话题")
        }
      })
    }
  })

  useMap(topic.topics, v => v.description, function (v, i) {
    useDom("div", {
      css: `
      cursor:pointer;
      `,
      onClick(e) {
        e.stopPropagation()
        topicPanel(operate, v)
      },
      children() {
        useContent(v.description)
      }
    })
    useDom("hr")
  })
})