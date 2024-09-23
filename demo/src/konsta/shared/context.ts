import { createContext, renderStateHolder } from "better-react";
import { useChange } from "better-react-helper";
import { EmptyFun } from "wy-helper";


export type Theme = "material" | "ios"
export const KonstaContext = createContext<{
  theme: Theme
  dark: boolean,
  touchRipple: boolean
}>({
  theme: "material",
  dark: true,
  touchRipple: true
})

export function renderRedefineKonsta(props: {
  theme?: Theme,
  dark?: boolean,
  touchRipple?: boolean
}, render: EmptyFun) {
  const ctx = KonstaContext.useConsumer()
  renderStateHolder(() => {
    KonstaContext.useProvider({
      ...ctx,
      ...props
    })
    render()
  })
}