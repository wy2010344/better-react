
import { dom } from "better-react-dom";
// import { requestAnimationFrameScheduler } from "better-react-dom";
import { createContext } from "better-react";
import { emptyArray } from "wy-helper";
import { useVersion } from "better-react-helper";
export default function demo() {

  const [version, updateVersion] = useVersion()


  VCtx.hookProvider({
    value: version,
    updateVersion
  })

  console.log("变化外", version)
  dom.div().render(function () {

    console.log("变化内", version)

    dom.div().render(function () {
      const { value, updateVersion } = VCtx.useConsumer()

      dom.button({
        onClick: updateVersion
      }).renderText`version${value}`
    })
  }, emptyArray)
}

const VCtx = createContext<{
  value: number,
  updateVersion(): void
}>(null as any)