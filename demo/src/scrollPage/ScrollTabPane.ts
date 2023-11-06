import { useEffect } from "better-react";
import { useDom } from "better-react-dom";
import { useEvent, useState, renderArray, useMemo } from "better-react-helper";
import { initDrag } from "../panel/drag";


export type TabDefine<T> = {
  key: T,
  css?: string
  body(): void
}
type TabAllDefine<T> = TabDefine<T> & {
  realKey: string
}

function halfShouldPage(width: number, x: number) {
  return 2 * x > width
}
function beginTransaction(v: HTMLElement, config: {
  property?: string
  duration: number
  type?: string
  delay?: number
  transform: string
}, after?: () => void) {
  v.style.transition = `${config.property || 'all'} ${config.duration}ms ${config.type || 'ease'} ${config.delay || 0}ms`
  v.style.transform = config.transform
  setTimeout(() => {
    v.style.transition = ''
    after?.()
  }, config.duration + (config.delay || 0))
}
export default function ScrollTabPane<T>({
  css,
  containerCSS,
  tabs,
  setSelected,
  selected,
  shouldPage
}: {
  css?: string
  containerCSS?: string
  tabs: TabDefine<T>[]
  setSelected(v: T): void
  selected: T
  shouldPage?(width: number, x: number): boolean
}) {

  const container = useDom("div", {
    style: `
    ${css || ''}
    overflow:hidden;
    `,
    children() {
      const tabContainer = useDom("div", {
        style: `
        ${containerCSS || ''}
        width:300%;
        display:flex;
        `,
        children() {
          const allTabs: TabAllDefine<T>[] = useMemo(() => {
            if (tabs.length < 2) {
              return tabs.concat(tabs).concat(tabs).map((v, i) => {
                return {
                  ...v,
                  realKey: v.key + "--repeat--" + i
                }
              })
            } else
              if (tabs.length < 3) {
                return tabs.concat(tabs).map((v, i) => {
                  return {
                    ...v,
                    realKey: v.key + "--repeat--" + i
                  }
                })
              }
            return tabs.map((v, i) => {
              return {
                ...v,
                realKey: v.key + "--repeat--" + i
              }
            })
          }, [tabs])

          const [selectRealKey, setSelectRealKey] = useState(() => allTabs.find(v => v.key == selected)?.realKey)
          const [step, setStep] = useState<"drag" | "animate" | undefined>(undefined)
          const { before, current, after, index } = useMemo(() => {
            const idx = allTabs.findIndex(v => v.realKey == selectRealKey)
            const before = allTabs[idx == 0 ? allTabs.length - 1 : idx - 1]
            const after = allTabs[idx == allTabs.length - 1 ? 0 : idx + 1]
            return {
              index: idx,
              before,
              current: allTabs[idx],
              after
            }
          }, [selectRealKey, allTabs])

          const control = useMemo(() => {

            let translateX = 0
            function getTransform(x: number) {
              translateX = x
              return `translateX(calc(-100% / 3 + ${x}px))`
            }
            function setTranslateX(x: number) {
              tabContainer.style.transform = getTransform(x)
            }
            setTranslateX(translateX)
            function animateTabContainer(x: number, next?: TabAllDefine<T>) {
              setStep("animate")
              beginTransaction(tabContainer, {
                duration: 500,
                transform: getTransform(x)
              }, () => {
                setTranslateX(0)
                setStep(undefined)
                if (next) {
                  setSelected(next.key)
                  setSelectRealKey(next.realKey)
                }
              })
            }
            return {
              getTranslateX() {
                return translateX
              },
              setTranslateX,
              addTranslateX(v: number) {
                setTranslateX(translateX + v)
              },
              animateTabContainer
            }
          }, [])

          const finishDrag = useEvent(() => {
            const translateX = control.getTranslateX()
            const width = container.offsetWidth
            const thisShouldPage = shouldPage || halfShouldPage
            if (translateX < 0) {
              if (thisShouldPage(width, -translateX)) {
                control.animateTabContainer(-width, before)
              } else {
                control.animateTabContainer(0)
              }
            } else {
              if (thisShouldPage(width, translateX)) {
                control.animateTabContainer(width, after)
              } else {
                control.animateTabContainer(0)
              }
            }
          })

          useEffect(() => {
            return initDrag(container, {
              leaveEnd: true,
              start(e) {
                control.setTranslateX(0)
                setStep("drag")
                // e.preventDefault()
                // e.stopPropagation()
              },
              move(e) {
                e.preventDefault()
                e.stopPropagation()
              },
              diffX(x) {
                control.addTranslateX(x)
              },
              end(e) {
                // e.preventDefault()
                // e.stopPropagation()
                finishDrag()
              },
            })
          }, [])

          useEffect(() => {
            if (step) {
              return
            }
            const real = allTabs.find(v => v.key == selected && v.realKey == selectRealKey)
            if (!real) {
              //没有找到
              const idx = allTabs.findIndex(v => v.key == selected)
              const width = container.offsetWidth
              control.animateTabContainer(width * ((idx > index) ? -1 : 1), allTabs[idx])
            }
          }, [selected, step])

          renderArray([before, current, after], v => v.realKey, function (row, i) {
            useDom("div", {
              style: `
              ${row.css || ''}
              flex:1;
              min-width:0;
              height:${i == 1 || step ? '' : '0px'}
              `,
              children: row.body
            })
          })
        },
      })
    },
  })
}
