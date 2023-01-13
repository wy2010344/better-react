import { useIf, useMap, useState } from "better-react";
import { useContent, useDom } from "better-react-dom";
import { getTextColor } from "../colorUtil";
import { TopicModel, useUser } from "../dbStore";
import { panelWith } from "../panel/PanelContext";
import person from "./person";




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
        useContent(topic.description)
      }
    })
    useDom("button", {
      onClick(e) {
        person(operate)
        e.stopPropagation()
      },
      children() {
        useContent(`增加人物`)
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
                        useContent("参与人")
                      }
                    })
                    useDom("th", {
                      children() {
                        useContent("提出建议")
                      }
                    })
                    useMap(topic.votes, v => v.description, vote => {
                      const user = vote.creater ? users.find(v => v.name == vote.creater) : undefined
                      useDom("th", {
                        style: user ? {
                          backgroundColor: user.color,
                          color: getTextColor((user.color || "#000000").slice(1))
                        } : undefined,
                        textContent: vote.description
                      })
                    })
                  }
                })
              }
            })
            useDom("tbody", {
              children() {
                useMap(users, v => v.name, user => {
                  useDom("tr", {
                    children() {
                      useDom("td", {
                        style: {
                          backgroundColor: user.color,
                          color: getTextColor((user.color || "#000000").slice(1))
                        },
                        textContent: user.name
                      })
                      useDom("td", {
                        children() {
                          const vote = topic.votes.find(v => v.creater == user.name)
                          useIf(
                            !!vote,
                            () => {
                              useDom("div", {
                                style: {
                                  backgroundColor: user.color,
                                  color: getTextColor((user.color || "#000000").slice(1))
                                },
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
                                  useContent("提出建议")
                                }
                              })
                            })
                        }
                      })
                      useMap(topic.votes, v => v.description, (vote, i) => {
                        useDom("td", {
                          children() {
                            useIf(
                              vote.whoVotes.includes(user.name),
                              () => {
                                useContent("已选择")
                              },
                              () => {
                                useDom("button", {
                                  style: {
                                    width: "20px",
                                    height: "30px"
                                  },
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
                                    useContent("")
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