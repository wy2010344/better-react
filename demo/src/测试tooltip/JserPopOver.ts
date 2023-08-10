import { EmptyFun, createContext } from "better-react";
import { normalPanel } from "../panel/PanelContext";
import { renderFragment, useChange } from "better-react-helper";

export default normalPanel(function () {

  PopOver({
    preferredPosition: "bottom-center"
  }, function () {

  })
})

type Rect = {
  left: number
  top: number
  width: number
  height: number
}
const defaultRect: Rect = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
};
type Position = 'bottom-center' | 'bottom-left' | 'bottom-right'

const PopOverContext = createContext<{
  isShow: boolean;
  setIsShow(v: boolean): void
  preferredPosition: Position;
  triggerRect: Rect;
  setTriggerRect(v: Rect): void
}>(null as any)

function PopOver({
  preferredPosition = 'bottom-center',
}: {
  preferredPosition: Position;
}, children: EmptyFun) {
  renderFragment(function () {
    const [isShow, setIsShow] = useChange(false)
    const [triggerRect, setTriggerRect] = useChange(defaultRect)
    PopOverContext.useProvider({
      isShow,
      setIsShow,
      preferredPosition,
      setTriggerRect,
      triggerRect
    })
    children()
  })
}

