import { history } from '@/history'
import { fdom } from 'better-react-dom'

export default function () {
  fdom.div({
    className: 'bg-red',
    children() {
      fdom.button({
        className: 'bg-fuchsia-900',
        onClick() {
          history.push('./count-demo')
        },
        children: '进入',
      })
    },
  })
}
