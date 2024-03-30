import { dom } from "better-react-dom"
import { useMemo } from "better-react-helper"
import { css, stringifyStyle } from "wy-dom-helper"

/**
 * 
 * @param param0 
 * @returns 
 */
export function ToolTip({
  parentRef,
  anchorRef,
  children,
  className,
  backgroundColor = '#191919f2',
  width: initWidth,
  marginLeft = 0,
  marginRight = 0
}: {
  /**需要设置为relative/absolute */
  parentRef: HTMLDivElement
  anchorRef: HTMLDivElement
  children(): void
  backgroundColor?: string
  className?: string
  /**
   * 如果指定的width/rem,优先考虑marginLeft,再考虑marginRight
   */
  width?: number
  marginLeft?: number
  marginRight?: number
}) {
  const { width, bottom, left, arrowLeft } = useMemo(() => {
    if (!parentRef.contains(anchorRef)) {
      console.log("parentRef does not contain anchorRef", parentRef, anchorRef)
    }
    const { x, y } = getElementPagePosition(anchorRef, parentRef)
    const aWidth = anchorRef.clientWidth
    const aHeight = anchorRef.clientHeight

    const pWidht = parentRef.clientWidth
    const pHeight = parentRef.clientHeight

    const bottom = pHeight - y + 10

    //const bottom = pRect.bottom - tRect.bottom + tRect.height + 10
    if (initWidth) {
      const wWidth = (initWidth)
      let left = 0
      let arrowLeft = 0
      if (marginLeft) {
        left = marginLeft
        arrowLeft = x - left
      } else {
        left = pWidht - (marginRight) - wWidth
        arrowLeft = x - left
      }
      return {
        width: wWidth,
        bottom,
        left,
        arrowLeft
      }
    } else {
      const cWidth = parentRef.clientWidth - (marginLeft) - (marginRight)
      const arrowLeft = x - ((17 - aWidth) / 2) - (marginLeft)
      return {
        width: cWidth,
        bottom,
        left: (marginLeft),
        arrowLeft: arrowLeft
      }

    }
  }, [parentRef, anchorRef, marginLeft, marginRight])

  return dom.div({
    className,
    style: stringifyStyle({
      width: width + 'px',
      bottom: bottom + 'px',
      left: left + 'px',
      backgroundColor
    })
  }).renderFragment(function () {

    children()
    // svg.svg({
    //   className: "arrow",
    //   style: stringifyStyle({
    //     left: arrowLeft + 'px',
    //     bottom: '-9px'
    //   }),
    //   width: "17",
    //   height: "10",
    //   viewBox: "0 0 17 10",
    //   fill: "none"
    // }).render(function () {
    //   svg.path({
    //     d: "M0 0.757813L8.48528 9.24309L16.9706 0.757812L0 0.757813Z",
    //     fill: "#191919"
    //   })
    // })
  })
}
const className = css` 
position:absolute;
margin-left:0px!important;
margin-right:0px!important;
>.arrow{
  position:absolute;
}
`
function getElementPagePosition(element: HTMLElement, parent: HTMLElement) {
  while (!element.offsetParent) {
    element = element.parentNode as HTMLElement
  }
  //计算x坐标
  var actualLeft = element.offsetLeft || 0;
  //计算y坐标
  var actualTop = element.offsetTop || 0;
  var current = element.offsetParent as HTMLElement
  while (current && current != parent) {
    actualLeft += current.offsetLeft;
    actualTop += (current.offsetTop + current.clientTop);

    current = current.offsetParent as HTMLElement
  }
  //返回结果
  return {
    x: actualLeft,
    y: actualTop
  }
}


export function getToolTipCss(width: string, anchorWidth: string, padding: {
  backgroundColor: string,
  vertical: string,
  horizontal: string
}) {

  return `
  background-color:${padding.backgroundColor};
width: ${width};
padding: ${padding.vertical} ${padding.horizontal};
position: absolute;
z-index: 1;
transition: opacity 0.3s;
&::after{
  content: "";
  position: absolute;
  border-width: ${anchorWidth};
  border-style: solid;
  //background:blue;
}

&.top{
  bottom: calc(100% + ${anchorWidth} * 2);
  ${width
      ? `left: 50%;
  margin-left: calc(${width}/-2);`
      : ``}
  &::after{
    margin-left: calc(${anchorWidth}/-1);
    top: 100%;
    left: 50%;
    border-color: ${padding.backgroundColor} transparent transparent transparent;
  }
}
&.left{
  top:  calc(${padding.vertical}/-1);
  right: calc(100% + ${anchorWidth} * 2);
  &::after{
    top: 50%;
    left: 100%;
    margin-top: calc(${anchorWidth}/-1);
    border-color: transparent transparent transparent ${padding.backgroundColor};
  }
}
&.right{
  top:  calc(${padding.vertical}/-1);
  left: calc(100% + ${anchorWidth} * 2);
  &::after{
    top: 50%;
    right: 100%;
    margin-top: calc(${anchorWidth}/-1);
    border-color: transparent ${padding.backgroundColor} transparent transparent;
  }
}
&.bottom{
  top: calc(100% + ${anchorWidth} * 2);
  ${width
      ? `left: 50%;
  margin-left: calc(${width}/-2);`
      : ''}
  &::after{
    bottom: 100%;
    left: 50%;
    margin-left: calc(${anchorWidth}/-1);
    border-color: transparent transparent ${padding.backgroundColor} transparent;
  }
}
  `
}