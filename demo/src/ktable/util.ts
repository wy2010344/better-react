import { React, domOf } from "better-react-dom"
export type KColumnPosition = "left" | "center" | "right"
export type KColumn = {
  key: any
  renderHeader(position: KColumnPosition, i: number): void
  renderCell(position: KColumnPosition, i: number, row: number): void
  renderFooter(position: KColumnPosition, i: number): void
}
export function getKColumnKey(c: KColumn) {
  return c.key
}
export function getXPanel(position: KColumnPosition, i: number): XPosition | undefined {
  if (position == 'left') {
    return "leftPanel"
  } else if (position == 'center' && i == 0) {
    return "centerFirst"
  }
}
export type XPosition = 'leftPanel' | 'centerFirst' | false



export function renderKColumns(size: number, style?: React.CSSProperties): KColumn[] {
  return Array(size).fill(1).map((_, i) => {
    return {
      key: "a" + i,
      renderHeader(position, i) {
        renderHeader({
          style,
          xPosition: getXPanel(position, i)
        }, i)
      },
      renderCell(position, i, row) {
        renderCell({
          style,
          xPosition: getXPanel(position, i),
          isFirstRow: row == 0
        }, {
          column: i,
          row
        })
      },
      renderFooter(position, i) {
        renderFooter({
          style,
          xPosition: getXPanel(position, i)
        }, i)
      },
    }
  })
}

export const defaultBoxShadow = `0px 0px 0px 0px rgba(23, 23, 71, 0.08), 0px 8px 17px 0px rgba(23, 23, 71, 0.08), 0px 30px 30px 0px rgba(23, 23, 71, 0.07), 0px 68px 41px 0px rgba(23, 23, 71, 0.04), 0px 121px 48px 0px rgba(23, 23, 71, 0.01), 0px 188px 53px 0px rgba(23, 23, 71, 0.00);`

export function renderHeader({
  style: outStyle,
  xPosition
}: {
  style?: React.CSSProperties
  xPosition?: XPosition
}, i: number) {
  const style: React.CSSProperties = {
    ...outStyle,
    boxShadow: defaultBoxShadow,
    height: '30px',
    padding: '5px',
    borderBottom: '1px solid black',
    background: 'gray',
    position: "sticky",
    top: '0'
  }
  if (xPosition == "leftPanel") {
    style.borderRight = '1px solid black'
  } else if (xPosition != 'centerFirst') {
    style.borderLeft = '1px solid black'
  }
  domOf("div", {
    style
  }).renderTextContent("header--" + i)
}


export function renderCell({
  style: outStyle,
  isFirstRow,
  xPosition
}: {
  style?: React.CSSProperties
  /**是否是第一行 */
  isFirstRow: boolean
  /**
   * rightPanel:是否在右边面板
   * centerLast:中间的最后 
   */
  xPosition?: XPosition
}, {
  column,
  row
}: {
  column: number,
  row: number,
}) {
  const style: React.CSSProperties = {
    ...outStyle,
    height: '30px',
    padding: '5px',
    backgroundColor: 'white'
  }
  if (xPosition == 'leftPanel') {
    style.borderRight = '1px solid black'
  } else if (xPosition != 'centerFirst') {
    style.borderLeft = '1px solid black'
  }
  if (!isFirstRow) {
    style.borderTop = '1px solid black'
  }
  domOf("div", {
    style
  }).renderTextContent(column + ' ' + row)
}


export function renderFooter({
  style: outStyle,
  xPosition
}: {
  style?: React.CSSProperties
  xPosition?: XPosition
}, i: number) {
  const style: React.CSSProperties = {
    ...outStyle,
    boxShadow: defaultBoxShadow,
    height: '30px',
    padding: '5px',
    borderTop: '1px solid black',
    background: 'gray',
    position: "sticky",
    bottom: '0'
  }
  if (xPosition == "leftPanel") {
    style.borderRight = '1px solid black'
  } else if (xPosition != 'centerFirst') {
    style.borderLeft = '1px solid black'
  }
  domOf("div", {
    style
  }).renderTextContent("footer--" + i)
}
