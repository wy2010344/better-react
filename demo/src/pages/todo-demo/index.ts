import { fdom } from 'better-react-dom'
import { renderArray, useState } from 'better-react-helper'
import { emptyArray, quote } from 'wy-helper'

export default function () {
  const [list, setList] = useState(emptyArray as number[])
  fdom.div({
    className:
      'max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-lg border border-gray-100 p-6',
    children() {
      fdom.div({
        className: 'flex items-center justify-between mb-4',
        children() {
          fdom.h2({
            className: 'text-lg font-semibold text-gray-800',
            childrenType: 'text',
            children: 'renderArray 列表增删',
          })
          fdom.button({
            className:
              'px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium',
            childrenType: 'text',
            children: '添加',
            onClick() {
              setList((list) => list.concat(Date.now()))
            },
          })
        },
      })
      renderArray(list, quote, (row, i) => {
        fdom.div({
          className:
            'flex items-center justify-between py-2.5 px-3 mb-2 rounded-lg bg-gray-50',
          children() {
            fdom.span({
              className: 'text-sm text-gray-700',
              childrenType: 'text',
              children: `第${i + 1}行 · ${row}`,
            })
            fdom.button({
              className:
                'px-3 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 text-sm',
              childrenType: 'text',
              children: '删除',
              onClick() {
                setList((list) => list.filter((item) => item != row))
              },
            })
          },
        })
      })
    },
  })
}
