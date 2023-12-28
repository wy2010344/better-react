import { renderArray } from "better-react-helper";
import { renderContent, useDom } from "better-react-dom";
import { getTextColor } from "../colorUtil";
import { TopicModel, useUser } from "../dbStore";
import { panelWith } from "../panel/PanelContext";
import { renderIf, useState } from "better-react-helper"
import person from "./person";
import { stringifyStyle } from "wy-dom-helper";




export default panelWith({
  children(operate, id, v: {
    topic: TopicModel,
    setTopic(v: TopicModel): void
  }) {
    const [topic, setThisTopic] = useState(v.topic)
    function setTopic(x: TopicModel) {
      setThisTopic(x)
      v.setTopic(x)
    }
    useDom("div", {
      children() {
        renderContent(topic.description)
      }
    })
    useDom("button", {
      onClick(e) {
        person(operate)
        e.stopPropagation()
      },
      children() {
        renderContent(`增加人物`)
      }
    })
    useDom("div", {
      children() {
        const { users } = useUser()
        useDom("table", {
          children() {
            useDom("thead", {
              children() {
                useDom("tr", {
                  children() {
                    useDom("th", {
                      children() {
                        renderContent("参与人")
                      }
                    })
                    useDom("th", {
                      children() {
                        renderContent("提出建议")
                      }
                    })
                    renderArray(topic.votes, v => v.description, vote => {
                      const user = vote.creater ? users.find(v => v.name == vote.creater) : undefined
                      useDom("th", {
                        style: user ? stringifyStyle({
                          backgroundColor: user.color,
                          color: getTextColor((user.color || "#000000").slice(1))
                        }) : undefined,
                        textContent: vote.description
                      })
                    })
                  }
                })
              }
            })
            useDom("tbody", {
              children() {
                renderArray(users, v => v.name, user => {
                  useDom("tr", {
                    children() {
                      useDom("td", {
                        style: stringifyStyle({
                          backgroundColor: user.color,
                          color: getTextColor((user.color || "#000000").slice(1))
                        }),
                        textContent: user.name
                      })
                      useDom("td", {
                        children() {
                          const vote = topic.votes.find(v => v.creater == user.name)
                          renderIf(
                            !!vote,
                            () => {
                              useDom("div", {
                                style: stringifyStyle({
                                  backgroundColor: user.color,
                                  color: getTextColor((user.color || "#000000").slice(1))
                                }),
                                textContent: vote!.description
                              })
                            },
                            () => {
                              useDom("button", {
                                onClick() {
                                  const value = prompt("请输入建议")?.trim()
                                  if (value && !topic.votes.find(v => v.description == value)) {
                                    const newVotes = topic.votes.concat([{
                                      whoVotes: [
                                        user.name
                                      ],
                                      description: value,
                                      creater: user.name
                                    }])
                                    setTopic({
                                      ...topic,
                                      votes: newVotes
                                    })
                                  }
                                },
                                children() {
                                  renderContent("提出建议")
                                }
                              })
                            })
                        }
                      })
                      renderArray(topic.votes, v => v.description, (vote, i) => {
                        useDom("td", {
                          children() {
                            renderIf(
                              vote.whoVotes.includes(user.name),
                              () => {
                                renderContent("已选择")
                              },
                              () => {
                                useDom("button", {
                                  style: stringifyStyle({
                                    width: "20px",
                                    height: "30px"
                                  }),
                                  onClick() {
                                    //console.log("set-top-before", topic.votes.map(v => v.whoVotes.join('-')).join("|"))
                                    const votes = topic.votes.slice()
                                    const whoVotes = vote.whoVotes.concat([user.name])
                                    votes.forEach(m => {
                                      const idx = m.whoVotes.indexOf(user.name)
                                      if (idx > -1) {
                                        m.whoVotes.splice(idx, 1)
                                      }
                                    })
                                    const newVote = {
                                      ...vote,
                                      whoVotes
                                    }
                                    votes.splice(i, 1, newVote)
                                    setTopic({
                                      ...topic,
                                      votes
                                    })
                                  },
                                  children() {
                                    renderContent("")
                                  }
                                })
                              })
                          }
                        })
                      })
                    }
                  })
                })
              }
            })
          }
        })
      }
    })
  }
})