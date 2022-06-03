import { BRNode } from "better-react"
import { React } from "better-react-dom"

export default function AbsPopOver({
  alignment,
  direction,
  overlay,
  children
}: {
  alignment?: "start" | "center" | "end"
  direction?: "left" | "right" | "top" | "bottom"
  overlay?: React.ReactNode
  children: React.ReactNode
}) {
  let css = ``
  let flexDirection = ''
  if (direction == 'left') {
    flexDirection = 'row-reverse'
    if (alignment == 'start') {
      css = `
      right:0;
      top:0;
      `
    } else if (alignment == 'end') {
      css = `
      right:0;
      bottom:0;
      `
    } else {
      css = `
      right:0;
      top:0;
      transform:translateY(-50%);
      `
    }
  } else if (direction == 'right') {
    flexDirection = 'row'
    if (alignment == 'start') {
      css = `
      left:0;
      top:0;
      `
    } else if (alignment == 'end') {
      css = `
      left:0;
      bottom:0;
      `
    } else {
      css = `
      left:0;
      top:0;
      transform:translateY(-50%);
      `
    }
  } else if (direction == 'top') {
    flexDirection = 'column-reverse'
    if (alignment == 'start') {
      css = `
      bottom:0;
      left:0;
      `
    } else if (alignment == 'end') {
      css = `
      bottom:0;
      right:0;
      `
    } else {
      css = `
      bottom:0;
      left:0;
      transform:translateX(-50%);
      `
    }
  } else {
    flexDirection = 'column'
    if (alignment == 'start') {
      css = `
      top:0;
      left:0;
      `
    } else if (alignment == 'end') {
      css = `
      top:0;
      right:0;
      `
    } else {
      css = `
      top:0;
      left:0;
      transform:translateX(-50%);
      `
    }
  }
  let flexAlignment = ''
  if (alignment == 'start') {
    flexAlignment = 'flex-start'
  } else if (alignment == 'end') {
    flexAlignment = 'flex-end'
  } else {
    flexAlignment = 'center'
  }
  return (
    <div css={`
    display:flex;
    flex-direction:${flexDirection};
    align-items:${flexAlignment};
    `}>
      {children}
      {overlay && <div css={`
      position:relative;
      `}>
        <div css={`
      position:absolute;
      ${css}
      `}>
          {overlay}
        </div>
      </div>}
    </div>
  )
}
