import { flushSync, startTransition } from 'better-react'
import { fdom } from 'better-react-dom'
import { useState } from 'better-react-helper'

export default function () {
  const [v, setV] = useState(1)
  console.log('render...', v)

  const node = fdom.button({
    children: 'version:' + v,
    onClick() {
      console.log('click')
      setV((v) => v - 1)
      flushSync(() => {
        setV((v) => v * 2)
      })
      console.log(node.textContent)
    },
  })
}
