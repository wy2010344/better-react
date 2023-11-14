import { dom, domOf } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";
import { EmptyFun, useGetFlushSync } from "better-react";
import { renderIf, useChange, useEffect } from "better-react-helper";

export default normalPanel(function () {
  ButtonWithToolTip(
    "Hover over me (tooltip above)",
    function () {
      domOf("div").renderInnerHTML(`
        This tooltip does not fit above the button.
        <br />
        This is why it's displayed below instead!
      `)
    }
  )
  domOf("div", {
    style: `
     height: 50;
    `
  }).render()
  ButtonWithToolTip(
    "Hover over me (tooltip below)",
    function () {
      domOf("div").renderInnerHTML(`
      This tooltip fits above the button
      `)
    }
  )
  domOf("div", {
    style: `
     height: 50;
    `
  }).render()
  ButtonWithToolTip(
    "Hover over me (tooltip below)",
    function () {
      domOf("div").renderInnerHTML(`
      This tooltip fits above the button
      `)
    }
  )

})

function ButtonWithToolTip(
  text: string,
  content: EmptyFun
) {

  const [targetRect, setTargetRect] = useChange<DOMRect>();
  const button = domOf("button", {
    onPointerEnter(event) {
      const rect = button.getBoundingClientRect();
      setTargetRect(rect)
    },
    onPointerLeave(event) {
      setTargetRect(undefined)
    },
  }).renderTextContent(text)
  renderIf(targetRect, function () {
    const [tooltipHeight, setTooltipHeight] = useChange(0);

    let x = 0, y = 0;

    if (targetRect) {
      x = targetRect.left
      y = targetRect.top - tooltipHeight
      if (y < 0) {
        y = targetRect.bottom
      }
    }

    console.log("--", tooltipHeight)
    let now = performance.now();
    while (performance.now() - now < 100) {
      // Do nothing for a bit...
    }
    useEffect(() => {
      document.body.appendChild(tooltip)
    }, [tooltipHeight])
    const tooltip = dom.div({
      style: `
        position: absolute;
        pointerEvents: none;
        left: 0;
        top: 0;
        transform: translate3d(${x}px, ${y}px, 0);
        backgroundColor: black;
        color: white;
      `
    }).asPortal().render(function () {
      const flushSync = useGetFlushSync()
      useEffect(() => {
        // setTooltipHeight(contentDiv.getBoundingClientRect().height)
        flushSync(function () {
          setTooltipHeight(contentDiv.getBoundingClientRect().height)
        })
      }, [])
      const contentDiv = domOf("div").render(content)
    })
  })
}