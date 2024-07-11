import { addEffectDestroy, renderArray, renderIf, useAtom, useChange, useChangeFun, useEffect, useEvent, useHookEffect, useMemo, useValueCenter } from "better-react-helper";
import { Route, locationMatch } from "../util/createRouter";
import { renderPage } from "../util/page";
import { cacheVelocity, dateFromYearMonthDay, emptyArray, EmptyFun, getSpringBaseAnimationConfig, quote, run, scrollJudgeDirection, SetValue, syncMergeCenter, trueAndS, WeekVirtualView, YearMonthVirtualView } from "wy-helper";
import { idbOut } from "./idbUtil";
import { initDexieUtil } from "./dexieUtil";
import { LunarDay, SolarDay, SolarMonth, SolarWeek, Week } from "tyme4ts";
import { dom } from "better-react-dom";
import { animateFrame, dragInit, PagePoint, subscribeDragMove, subscribeMove } from "wy-dom-helper";
import { DragMessage, dragMovePageX } from "./dragMove";
import { da } from "@faker-js/faker";






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
      const dragYCenter = useValueCenter<DragMessage>()
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
          console.log("date", date)
          const week = useMemo(() => {
            return WeekVirtualView.from(date.year, date.month, date.day, 0)
          }, [date.year, date.month, date.day])
          const updateDirection = dragMovePageX(() => container, useEvent(direction => {
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
            dragYCenter.set(v)
          }, showWeek ? week.getKeys() : calendar.getKeys())
          const container = dom.div(v => {
            v.style.position = 'relative'
          }).render(() => {
            renderIf(showWeek, () => {
              renderArray([week.beforeWeek(), week, week.nextWeek()], quote, (row, i) => {
                dom.div(v => {
                  const s = v.style
                  s.display = 'flex'
                  s.alignItems = 'center'
                  s.justifyContent = 'space-between'
                  if (i != 1) {
                    s.position = 'absolute'
                    s.inset = 0
                    s.transform = `translateX(${(i - 1) * 100}%)`
                  }
                }).render(() => {
                  for (let x = 0; x < 7; x++) {
                    const md = row.cells[x]
                    const lunarDay = useMemo(() => {

                      const sd = SolarDay.fromYmd(md.year, md.month, md.day)
                      return sd.getLunarDay()
                    }, [md.year, md.month, md.day])
                    renderCell({
                      day: md.day,
                      lunarDay,
                      selected: md.year == date.year && md.month == date.month && md.day == date.day,
                      onClick() {
                        setDate(date)
                      }
                    })
                  }
                })
              })
            }, () => {
              renderArray([calendar.getlastMonth(), calendar, calendar.getNextMonth()], quote, (row, i) => {
                dom.div(v => {
                  const s = v.style
                  if (i != 1) {
                    s.position = 'absolute'
                    s.inset = 0
                    s.transform = ` translateX(${(i - 1) * 100}%)`
                  }
                }).render(() => {
                  renderCalendarView(row, date, fd => {
                    let c: YearMonthVirtualView = calendar
                    let dir = 0
                    if (fd.type == 'last') {
                      c = calendar.lastMonth()
                      dir = -1
                    } else if (fd.type == 'next') {
                      c = calendar.nextMonth()
                      dir = 1
                    }
                    setDate({
                      year: c.year,
                      month: c.month,
                      day: fd.day
                    })
                    updateDirection(dir)
                  })
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



function renderCalendarView(calendar: YearMonthVirtualView, date: DateModel, setDate: SetValue<{
  type: "last" | "this" | "next";
  day: number;
}>) {
  const selectCurrent = useMemo(() => {
    return date.year == calendar.year && date.month == calendar.month
  }, [calendar, date])
  for (let y = 0; y < 6; y++) {
    dom.div(v => {
      const s = v.style
      s.display = 'flex'
      s.alignItems = 'center'
      s.justifyContent = 'space-between'
    }).render(() => {
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
        renderCell({
          day: fd.day,
          onClick() {
            setDate(fd)
          },
          lunarDay,
          selected: fd.type == 'this' && selectCurrent && date.day == fd.day,
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