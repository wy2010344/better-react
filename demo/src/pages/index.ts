import { history } from '@/history'
import { fdom } from 'better-react-dom'
import { renderArray } from 'better-react-helper'
import { quote } from 'wy-helper'

const demos = [
  {
    href: './count-demo',
    icon: '🔢',
    title: 'Count Demo',
    desc: 'useChange 信号驱动的最小示例',
  },
  {
    href: './todo-demo',
    icon: '📝',
    title: 'Todo Demo',
    desc: 'renderArray 列表渲染与增删',
  },
  {
    href: './complex-todo-demo',
    icon: '✅',
    title: 'Complex TodoMVC',
    desc: 'useReducer 实现的完整 TodoMVC',
  },
]

export default function () {
  fdom.div({
    className:
      'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-8',
    children() {
      fdom.div({
        className: 'max-w-4xl w-full',
        children() {
          fdom.div({
            className: 'text-center mb-12',
            children() {
              fdom.h1({
                className:
                  'text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
                childrenType: 'text',
                children: 'better-react Demos',
              })
              fdom.p({
                className: 'text-lg text-gray-600',
                childrenType: 'text',
                children:
                  '函数式 API、信号驱动更新的 React 增强工具库示例集',
              })
            },
          })
          fdom.div({
            className: 'grid grid-cols-1 md:grid-cols-3 gap-6',
            children() {
              renderArray(
                demos,
                quote,
                demo => {
                  fdom.div({
                    className:
                      'bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1',
                    onClick() {
                      history.push(demo.href)
                    },
                    children() {
                      fdom.div({
                        className: 'text-4xl mb-4',
                        childrenType: 'text',
                        children: demo.icon,
                      })
                      fdom.h2({
                        className: 'text-xl font-bold text-gray-900 mb-2',
                        childrenType: 'text',
                        children: demo.title,
                      })
                      fdom.p({
                        className: 'text-sm text-gray-600',
                        childrenType: 'text',
                        children: demo.desc,
                      })
                    },
                  })
                },
              )
            },
          })
        },
      })
    },
  })
}
