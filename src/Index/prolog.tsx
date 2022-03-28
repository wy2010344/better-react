import { RouteFun } from '.'
import { createElement } from 'better-react-dom'
import { Fragment, useRefValue } from 'better-react'
import PanelReact from '../drag/PanelReact'
import { contentEditable } from '../drag/mb'
import useCodeJar from '../drag/useCodeJar'
import { useRef } from 'better-react-helper'

const prolog: RouteFun<void> = ({ close, moveToFirst }) => {

  const editor = useCodeJar({
    highlight(e, pos) {

    }
  })
  const ref = useRef<HTMLDivElement | null>(null)
  return (
    <PanelReact
      moveFirst={moveToFirst}
      close={close}
      title="prolog 测试"
    >{x => {
      return <div
        ref={ref}
        onClick={e => e.stopPropagation()}
        {...editor.event}
        spellCheck="true"
        contentEditable={contentEditable.text as any}
        onSelect={e => {
          console.log(e)
        }}
        onInput={e => {
          console.log("input", e)
        }}
        css={`
        width:100%;
        height:500px;
        background:gray;
      `}></div>
    }}</PanelReact>
  )
}
export default prolog