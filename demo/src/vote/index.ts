import { renderContent, useDom } from "better-react-dom";
import { useState, renderArray } from "better-react-helper";
import { useTopic } from "../dbStore";
import { normalPanel } from "../panel/PanelContext";
import topicPanel from "./topic";


export default normalPanel(function (operate, id) {
  const topic = useTopic()
  useDom("div", {
    children() {
      const textarea = useDom("textarea", {
        style: `
        width:100%;
        min-height:1rem;
        border:none;
        padding:0;
        resize:none;
        `,
        onInput(e) {
          textarea.style.height = textarea.scrollHeight + 'px'
        }
      })
      useDom("button", {
        onClick(e) {
          e.stopPropagation()
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
          renderContent("增加话题")
        }
      })
    }
  })

  renderArray(topic.topics, v => v.description, function (v, i) {
    useDom("div", {
      style: `
      cursor:pointer;
      `,
      onClick(e) {
        e.stopPropagation()
        topicPanel(operate, {
          topic: v,
          setTopic(v) {
            topic.update(v, i)
          }
        })
      },
      children() {
        renderContent(v.description)
      }
    })
    useDom("hr")
  })
})