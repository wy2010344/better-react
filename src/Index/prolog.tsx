import { RouteFun } from '.'
import { createElement } from 'better-react-dom'
import { Fragment, useRefValue } from 'better-react'
import PanelReact from '../drag/PanelReact'
import { contentEditable } from '../drag/mb'
import CodeJar from '../drag/CodeJar'
import { useRef, useState } from 'better-react-helper'
import { css } from 'stylis-creater'

import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
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
          className={javascripClass}
          type={value}
          height={100}
          highlight={e => {
            e.innerHTML = highlight(e.textContent || "", languages.javascript, "javascript")
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


const javascripClass = css`   
/* Syntax highlighting */
.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: #90a4ae;
}

.token.punctuation {
  color: #9e9e9e;
}

.namespace {
  opacity: 0.7;
}

.token.property,
.token.tag,
.token.boolean,
.token.number,
.token.constant,
.token.symbol,
.token.deleted {
  color: #e91e63;
}

.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin,
.token.inserted {
  color: #4caf50;
}

.token.operator,
.token.entity,
.token.url,
.language-css .token.string,
.style .token.string {
  color: #795548;
}

.token.atrule,
.token.attr-value,
.token.keyword {
  color: #3f51b5;
}

.token.function {
  color: #f44336;
}

.token.regex,
.token.important,
.token.variable {
  color: #ff9800;
}

.token.important,
.token.bold {
  font-weight: bold;
}

.token.italic {
  font-style: italic;
}

.token.entity {
  cursor: help;
}`
export default prolog