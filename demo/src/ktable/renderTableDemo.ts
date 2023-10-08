import { React, domOf } from "better-react-dom";
import { renderDisplayTable, renderTable } from "./renderTable";
import { defaultBoxShadow } from "./util";

export function renderTableDemo() {
  domOf("div", {
    style: {
      width: '100%',
      height: '100%',
      overflow: "auto"
    }
  }).render(function () {
    renderTable({
      dataSize: 100,
      getKey(i) {
        return i
      },
      columns: Array(30).fill(1).map((_, i) => {
        let style: React.CSSProperties | undefined = undefined
        if (i == 0) {
          style = {
            position: 'sticky',
            zIndex: 1,
            left: 0
          }
        } else if (i == 29) {
          style = {
            position: 'sticky',
            zIndex: 1,
            right: 0
          }
        } else {
          style = {}
        }

        if (i == 0) {
          style.borderRight = '1px solid gray'
        } else if (i != 1) {
          style.borderLeft = '1px solid gray'
        }

        return {
          key: i,
          renderHeader(c) {
            return domOf("th", {
              style: {
                ...style,
                background: "white",
                borderBottom: "1px solid gray"
              }
            }).renderTextContent(`${c}---header`)
          },
          renderCell(i, c) {
            return domOf("td", {
              style: {
                ...style,
                background: "white",
                borderTop: i != 0 ? "1px solid gray" : ''
              }
            }).renderTextContent(`${c}---${i}`)
          },
          renderFooter(c) {
            return domOf("td", {
              style: {
                ...style,
                background: "white",
                borderTop: "1px solid gray"
              }
            }).renderTextContent(`${c}---footer`)
          },
        }
      })
    })
  })
}



/**
 * 用单列试,inline-block也会出现滚动时第一列sticky失效,但是根上加上display:table又恢复了?
 */
export function renderDisplayTableDemo() {
  domOf("div", {
    style: {
      width: '100%',
      height: '100%',
      overflow: "auto",
    }
  }).render(function () {
    renderDisplayTable({
      dataSize: 100,
      getKey(i) {
        return i
      },
      style: {
        display: 'table'
      },
      rowStyle: {
        whiteSpace: 'nowrap'
        // display: "table-row"
      },
      columns: Array(30).fill(1).map((_, i) => {
        const style: React.CSSProperties = {
          display: 'inline-flex',
          width: '100px'
          // display: "table-cell"
        }
        if (i == 0) {
          style.position = 'sticky'
          style.zIndex = 1
          style.left = 0
          style.boxShadow = defaultBoxShadow
        } else if (i == 29) {
          style.position = 'sticky'
          style.zIndex = 1
          style.right = 0
          style.boxShadow = defaultBoxShadow
        }

        if (i == 0) {
          style.borderRight = '1px solid gray'
        } else if (i != 1) {
          style.borderLeft = '1px solid gray'
        }

        return {
          key: i,
          renderHeader(c) {
            return domOf("div", {
              style: {
                ...style,
                background: "white",
                borderBottom: "1px solid gray"
              }
            }).renderTextContent(`${c}---header`)
          },
          renderCell(i, c) {
            return domOf("div", {
              style: {
                ...style,
                background: "white",
                borderTop: i != 0 ? "1px solid gray" : ''
              }
            }).renderTextContent(`${c}---${i}`)
          },
          renderFooter(c) {
            return domOf("div", {
              style: {
                ...style,
                background: "white",
                borderTop: "1px solid gray"
              }
            }).renderTextContent(`${c}---footer`)
          },
        }
      })
    })
  })
}