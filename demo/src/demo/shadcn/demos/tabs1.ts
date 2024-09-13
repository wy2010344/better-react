import { renderPage } from "@/demo/util/page";
import { cn } from "@/utils";
import { dom } from "better-react-dom";
import { renderExitAnimateArray, renderIf, useChange, useDirection, useEffect, useExitAnimate, useMemo, useRef } from "better-react-helper";
import { tabsContent, tabsList, tabsTrigger } from "../components/tabs";
import { emptyArray } from "wy-helper";
import { animate } from "motion";
import { card, cardContent, cardDescription, cardFooter, cardHeader, cardTitle } from "../components/card";
import { buttonVariants } from "../components/button";
import { label } from "../components/label";
import { input } from "../components/input";
import { getSwitchCls } from "../components/switch";



export default function () {
  renderPage({
    title: "tabs"
  }, () => {

    const tabs = [
      {
        key: "account",
        label: "Account",
        children() {
          dom.div({
            className: card
          }).render(() => {
            dom.div({
              className: cardHeader
            }).render(() => {
              dom.div({
                className: cardTitle
              }).renderText`Account`
              dom.div({
                className: cardDescription
              }).renderText`Make changes to your account here. Click save when you're done.`
            })
            dom.div({
              className: cn(
                cardContent,
                'space-y-2'
              )
            }).render(() => {
              dom.div({ className: "space-y-1" }).render(() => {
                dom.label({ className: label, htmlFor: "name" }).renderText`Name`
                dom.input({ className: input, id: "name" }).render()
              })

              dom.div({ className: "space-y-1" }).render(() => {
                dom.label({ className: label, htmlFor: "username" }).renderText`UserName`
                dom.input({ className: input, id: "username" }).render()
              })
              dom.div({
                className: "flex items-center space-x-2"
              }).render(() => {
                dom.label({ className: label, htmlFor: "remember" }).renderText`Remember`
                const [checked, setChecked] = useChange(false)
                const [switchCls, switchThumbCls] = getSwitchCls(checked)
                dom.button({
                  className: switchCls, onClick() {
                    setChecked(!checked)
                  }
                }).render(() => {
                  dom.span({
                    className: switchThumbCls
                  }).render()
                })
              })
            })
            dom.div({
              className: cardFooter
            }).render(() => {
              dom.button({
                className: buttonVariants()
              }).renderText`Save Change`
            })

          })
        }
      },
      {
        key: "password",
        label: "Password",
        children() {
          dom.div({
            className: card
          }).render(() => {
            dom.div({
              className: cardHeader
            }).render(() => {
              dom.div({
                className: cardTitle
              }).renderText`Password`
              dom.div({
                className: cardDescription
              }).renderText`Change your password here. After saving, you'll be logged out.`
            })
            dom.div({
              className: cn(
                cardContent,
                'space-y-2'
              )
            }).render(() => {
              dom.div({ className: "space-y-1" }).render(() => {
                dom.label({ className: label, htmlFor: "current" }).renderText`Current password`
                dom.input({ className: input, id: "current", type: "password" }).render()
              })
              dom.div({ className: "space-y-1" }).render(() => {
                dom.label({ className: label, htmlFor: "new" }).renderText`New password`
                dom.input({ className: input, id: "new", type: "password" }).render()
              })
            })
            dom.div({
              className: cardFooter
            }).render(() => {
              dom.button({
                className: buttonVariants()
              }).renderText`Save password`
            })

          })

        }
      }
    ] as const
    const [tab, setTab] = useChange<typeof tabs[number]['key']>("account")
    dom.div({
      className: `w-[400px] `
    }).render(() => {
      dom.div({
        className: cn(
          tabsList,
          `grid w-full grid-cols-2`
        )
      }).render(() => {
        const ref = useRef<HTMLDivElement | undefined>(undefined)


        tabs.forEach(row => {
          const selected = row.key == tab
          dom.button({
            className: cn(
              tabsTrigger,
              'relative',
              selected && 'text-foreground'
            ),
            onClick() {
              setTab(row.key)
            }
          }).render(() => {
            renderIf(selected, () => {
              const oldRect = useMemo(() => {
                const old = ref.current
                if (old) {
                  //在memo期间还能读取
                  return old.getBoundingClientRect()
                }
              }, emptyArray)
              useEffect(() => {
                if (oldRect) {
                  const oldLeft = oldRect.left
                  const newLeft = div.getBoundingClientRect().left
                  animate(div, {
                    x: [oldLeft - newLeft, 0]
                  })
                }
                ref.current = div
              }, emptyArray)


              const div = dom.div({
                className: `absolute inset-0 
                bg-background 
                text-foreground shadow rounded-md`
              }).render()
            })
            dom.div({
              className: `inset-0 px-3 py-1 
              relative transition-all
             `
            }).renderTextContent(row.label)
          })
        })
      })


      const [dir, index] = useDirection(tabs.findIndex(v => v.key == tab))

      dom.div({
        className: 'relative overflow-hidden'
      }).render(() => {
        renderExitAnimateArray(
          useExitAnimate(
            [tabs[index]],
            v => v.key,
            {
              enterIgnore: !dir,
              exitIgnore: !dir
            }
          ),
          row => {
            useEffect(() => {
              if (dir) {
                animate(div, {
                  x: row.exiting ? [0, `${-dir * 100}%`] : [`${dir * 100}%`, 0]
                }).finished.then(row.resolve)
              } else {
                row.resolve()
              }
            }, row.exiting)
            const div = dom.div({
              className: cn(
                tabsContent,
                row.value.key != tab && 'absolute inset-0'
              )
            }).render(() => {
              row.value.children()
            })
          }
        )
      })
    })
  })
}