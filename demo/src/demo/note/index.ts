import { addEffectDestroy, renderArray, renderIf, useAtom, useAtomFun, useChange, useChangeFun, useEffect, useEvent, useHookEffect, useMemo, useValueCenter } from "better-react-helper";
import { Route, locationMatch } from "../util/createRouter";
import { renderPage } from "../util/page";
import { cacheVelocity, createEmptyArray, dateFromYearMonthDay, emptyArray, EmptyFun, extrapolationClamp, getInterpolate, getSpringBaseAnimationConfig, MonthFullDay, quote, run, scrollJudgeDirection, SetValue, StoreRef, syncMergeCenter, syncMergeCenterArray, trueAndS, WeekVirtualView, YearMonthDay, YearMonthVirtualView } from "wy-helper";
import { idbOut } from "./idbUtil";
import { initDexieUtil } from "./dexieUtil";
import { LunarDay, SolarDay, SolarMonth, SolarWeek, Week } from "tyme4ts";
import { dom } from "better-react-dom";
import { animateFrame, dragInit, PagePoint, subscribeDragMove, subscribeMove } from "wy-dom-helper";
import { DragBMessage, DragMessage, DragMessageMove, dragMovePageX } from "./dragMove";
import { da } from "@faker-js/faker";
import { number } from "zod";
import { SetV } from "@/d3-learn/force/lib/model";






function createYM() {
  const d = new Date()
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate()
  }
}
type DateModel = {
  year: number
  month: number
  day: number
}
export const WEEKS = ["一", "二", "三", "四", "五", "六", "日"]
const DAYTIMES = 24 * 60 * 60 * 1000
const WEEKTIMES = 7 * DAYTIMES
const routes: Route[] = [
  {
    match: locationMatch('/note'),
    page(v) {
      const transY = useMemo(() => {
        return animateFrame(0)
      }, emptyArray)
      const dragYEvent = useValueCenter<DragMessage>()
      const currentRow = useValueCenter(0)
      let centerPanel: HTMLDivElement
      useHookEffect(() => {
        let lastEvent: DragBMessage | undefined = undefined
        const velocity = cacheVelocity()
        addEffectDestroy(dragYEvent.subscribe(function (e) {
          if (e) {
            if (e.type == 'end') {
              const cy = transY.get()
              if (cy > 0) {
                //向下拉
                transY.changeTo(0, getSpringBaseAnimationConfig())
              } else {
                const moveHeight = centerPanel.clientHeight / 6 * 5
                const dir = scrollJudgeDirection(velocity.get(), transY.get(), moveHeight)
                if (dir) {
                  transY.changeTo(-moveHeight, getSpringBaseAnimationConfig())
                  setShowWeek(true)
                } else {
                  transY.changeTo(0, getSpringBaseAnimationConfig())
                  setShowWeek(false)
                }
              }
              lastEvent = undefined
            } else {
              if (lastEvent) {
                const diff = e.point.pageY - lastEvent.point.pageY
                transY.changeTo(transY.get() + diff)
                velocity.append(e.event.timeStamp, e.point.pageY)
              } else {
                velocity.reset(e.event.timeStamp, e.point.pageY)
              }
              lastEvent = e
            }
          }
        }))
      }, emptyArray)
      const [showWeek, setShowWeek] = useChange(false)
      renderPage({
        title: "笔记",
        renderRight() {
          dom.button({
            onClick() {
              setShowWeek(!showWeek)
            }
          }).renderText`设置`
        },
        bodyStyle: `
        display:block;
        overflow-y:auto;
        overflow-x:hidden;
        container-type:size;
        `
      }, () => {
        const [date, setDate] = useChangeFun(createYM)
        dom.div(v => {
          v.style.width = '100%'
        }).render(() => {

          dom.div(v => {
            const s = v.style
            s.display = 'flex'
            s.alignItems = 'center'
            s.justifyContent = 'space-between'
          }).render(() => {
            dom.div().render(() => {
              dom.div().renderText`${date.month}/${date.year}`
            })
          })
          const calendar = useMemo(() => {
            return new YearMonthVirtualView(date.year, date.month, 0)
          }, [date.year, date.month])
          dom.div(v => {
            const s = v.style
            s.display = 'flex'
            s.alignItems = 'center'
            s.justifyContent = 'space-between'
          }).render(() => {
            for (let i = 0; i < 7; i++) {
              dom.div(v => {
                const s = v.style
                s.flex = 1
                s.aspectRatio = 1
                s.display = 'flex'
                s.alignItems = 'center'
                s.justifyContent = 'center'
              }).renderTextContent(WEEKS[calendar.weekDay(i)])
            }
          })

          const wrapper = dom.div(v => {
            v.style.overflow = 'hidden'
          }).render(() => {
            function toggleCalendar(c: YearMonthVirtualView) {
              if (date.day > c.days) {
                setDate({
                  year: c.year,
                  month: c.month,
                  day: c.days
                })
              } else {
                setDate({
                  year: c.year,
                  month: c.month,
                  day: date.day
                })
              }
            }
            function toggleWeek(dir: number) {
              const m = dateFromYearMonthDay(date)
              if (dir < 0) {
                m.setTime(m.getTime() - WEEKTIMES)
              } else if (dir > 0) {
                m.setTime(m.getTime() + WEEKTIMES)
              }
              setDate({
                year: m.getFullYear(),
                month: m.getMonth() + 1,
                day: m.getDate()
              })
            }
            const week = useMemo(() => {
              return WeekVirtualView.from(date.year, date.month, date.day, 0)
            }, [date.year, date.month, date.day])
            const [transX, updateDirection] = dragMovePageX(() => container, useEvent(direction => {
              if (showWeek) {
                toggleWeek(direction)
              } else {
                if (direction < 0) {
                  toggleCalendar(calendar.lastMonth())
                } else if (direction > 0) {
                  toggleCalendar(calendar.nextMonth())
                }
              }
            }), v => {
              dragYEvent.set(v)
            }, showWeek ? week.getKeys() : calendar.getKeys())

            useHookEffect(() => {
              addEffectDestroy(syncMergeCenter(transX, x => {
                container.style.transform = `translateX(${x}px)`;
              }))
              addEffectDestroy(syncMergeCenter(transY, y => {
                const maxHeight = centerPanel.clientHeight
                const perHeight = maxHeight / 6
                const moveHeight = perHeight * 5
                wrapper.style.height = getInterpolate({
                  0: maxHeight,
                  [-moveHeight]: perHeight
                }, extrapolationClamp)(y) + 'px'
              }))
            }, emptyArray)
            const container = dom.div(v => {
              v.style.position = 'relative'
            }).render(() => {
              function setCalenderData(fd: MonthFullDay) {
                let c: YearMonthVirtualView = calendar
                let dir = 0
                if (fd.type == 'last') {
                  c = calendar.lastMonth()
                  dir = -1
                } else if (fd.type == 'next') {
                  c = calendar.nextMonth()
                  dir = 1
                }
                updateDirection(dir, 0, () => {
                  setDate({
                    year: c.year,
                    month: c.month,
                    day: fd.day
                  })
                })
              }
              renderIf(showWeek, () => {
                renderWeek(week.beforeWeek(), date, 0, setDate)
              }, () => {
                dom.div(v => {
                  const s = v.style
                  s.position = 'absolute'
                  s.inset = 0
                  s.transform = `translateX(-100%)`
                }).render(() => {
                  renderCalendarView(calendar.lastMonth(), date, setCalenderData, currentRow)
                })
              })

              useHookEffect(() => {
                const maxHeight = centerPanel.clientHeight
                const perHeight = maxHeight / 6
                const moveHeight = perHeight * 5
                addEffectDestroy(syncMergeCenterArray([transY, currentRow] as const, ([y, row]) => {
                  centerPanel.style.transform = `translateY(${getInterpolate({
                    0: 0,
                    [-moveHeight]: - row * perHeight
                  }, extrapolationClamp)(y)}px)`
                }))
              }, emptyArray)
              centerPanel = dom.div().render(() => {
                renderCalendarView(calendar, date, setCalenderData, currentRow)
              })
              renderIf(showWeek, () => {
                renderWeek(week.nextWeek(), date, 2, setDate)
              }, () => {
                dom.div(v => {
                  const s = v.style
                  s.position = 'absolute'
                  s.inset = 0
                  s.transform = `translateX(100%)`
                }).render(() => {
                  renderCalendarView(calendar.nextMonth(), date, setCalenderData, currentRow)
                })
              })
            })
          })
        })
      })
    },
  }
]

export default routes


function renderWeek(
  row: WeekVirtualView,
  date: YearMonthDay,
  i: number,
  setDate: SetValue<YearMonthDay>) {
  return dom.div(v => {
    const s = v.style
    s.display = 'flex'
    s.alignItems = 'center'
    s.justifyContent = 'space-between'
    s.alignSelf = 'flex-start'
    if (i != 1) {
      s.position = 'absolute'
      s.inset = 0
      s.transform = `translateX(${(i - 1) * 100}%)`
    }
  }).render((c) => {
    for (let x = 0; x < 7; x++) {
      const md = row.cells[x]
      const lunarDay = useMemo(() => {
        const sd = SolarDay.fromYmd(md.year, md.month, md.day)
        return sd.getLunarDay()
      }, [md.year, md.month, md.day])
      const isSelected = md.year == date.year && md.month == date.month && md.day == date.day
      renderCell({
        day: md.day,
        lunarDay,
        selected: isSelected,
        onClick() {
          setDate(md)
        }
      })
    }
  })
}

function renderCalendarView(
  calendar: YearMonthVirtualView,
  date: DateModel,
  setDate: SetValue<{
    type: "last" | "this" | "next";
    day: number;
  }>,
  selectedRow: StoreRef<number>) {
  const selectCurrent = useMemo(() => {
    return date.year == calendar.year && date.month == calendar.month
  }, [calendar, date])
  for (let y = 0; y < 6; y++) {
    dom.div(v => {
      const s = v.style
      s.display = 'flex'
      s.alignItems = 'center'
      s.justifyContent = 'space-between'
    }).render((c) => {
      for (let x = 0; x < 7; x++) {
        const fd = calendar.fullDayOf(x, y)
        const lunarDay = useMemo(() => {
          let c: YearMonthVirtualView = calendar
          if (fd.type == 'last') {
            c = calendar.lastMonth()
          } else if (fd.type == 'next') {
            c = calendar.nextMonth()
          }
          const sd = SolarDay.fromYmd(c.year, c.month, fd.day)
          return sd.getLunarDay()
        }, [fd.day, fd.type, calendar])
        const selected = fd.type == 'this' && selectCurrent && date.day == fd.day
        if (selected) {
          selectedRow.set(y)
        }
        renderCell({
          day: fd.day,
          onClick() {
            setDate(fd)
          },
          lunarDay,
          selected,
          hide: fd.type != 'this'
        })
      }
    })
  }
}



function renderCell({
  selected,
  day,
  hide,
  onClick,
  lunarDay
}: {
  selected?: boolean
  day: number
  onClick: EmptyFun,
  lunarDay: LunarDay,
  hide?: boolean
}) {
  dom.div(v => {
    const s = v.style
    s.flex = 1
    s.aspectRatio = 1
    s.display = 'flex'
    s.flexDirection = 'column'
    s.alignItems = 'center'
    s.justifyContent = 'center'
    if (hide) {
      s.color = 'gray'
      s.opacity = '0.8'
    }
    v.onClick = onClick
  }).render(() => {
    dom.div(v => {
      const s = v.style
      s.aspectRatio = 1
      s.display = 'grid'
      s.placeItems = 'center'
      if (selected) {
        s.color = '#fff'
        s.borderRadius = '50%'
        s.background = 'green'
      }
    }).renderText`${day}`
    dom.div(v => {
      v.style.fontSize = '10px'
    }).renderText`${lunarDay.getName()}`
  })
}