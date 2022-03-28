import { RouteFun } from '.'
import { createElement } from 'better-react-dom'
import { Fragment, useRefValue } from 'better-react'
import PanelReact from '../drag/PanelReact'
import { contentEditable } from '../drag/mb'
import CodeJar from '../drag/CodeJar'
import { useRef, useState } from 'better-react-helper'

const prolog: RouteFun<void> = ({ close, moveToFirst }) => {

  const editorRef = useRefValue(() => document.body)
  const [value, setValue] = useState("div")
  console.log(value)
  return (
    <PanelReact
      moveFirst={moveToFirst}
      close={close}
      title="prolog 测试"
    >{x => {
      return <>
        <CodeJar
          type={value}
          height={100}
          highlight={e => {
          }} />
        <select value={value} onChange={e => {
          setValue(e.target.value)
        }}>
          <option>pre</option>
          <option>div</option>
        </select>
      </>
    }}</PanelReact>
  )
}
export default prolog