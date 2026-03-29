import { hookEnvModel } from 'better-react'
import { fdom } from 'better-react-dom'
import { useState } from 'better-react-helper'
import { hookCurrentThread } from 'wy-helper'

export default function () {
  const [v, setV] = useState(1)
  console.log('render...', v, hookCurrentThread())
  // useEffect(() => {
  //   if (v % 2) {
  //     layoutEffect(() => {
  //       console.log('effect', hookCurrentThread())
  //       setV((v) => v + 1)
  //     })
  //   }
  // }, [v])

  const appState = hookEnvModel().appState

  const node = fdom.button({
    children: 'version:' + v,
    onClick() {
      console.log('click')
      setV((v) => v + 1)
      // setV((v) => v - 1)
      // flushSync(() => {
      //   setV((v) => v * 2)
      // })
      appState.flushSync()
      console.log(node.textContent)
    },
  })
}
