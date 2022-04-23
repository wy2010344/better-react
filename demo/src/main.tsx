
import { nestCss } from './drag/NestCss';
import DeskTop from './drag/deskTop';
import './style.css'
import { createElement, StyleContext } from 'better-react-dom'
import { render } from 'better-react'
import { FiberNode } from 'better-react-dom';
import { askTimeWork } from '../../dom/src/askTimeWork';
import Index from './Index';
import { StylisCreater } from 'stylis-creater';


function App() {
  //return <>aaaa</>
  return <>
    <button onClick={() => {
      destroy()
    }}>销毁</button>
    <Index />
  </>
  //return <DeskTop />
  //return <Demo />
}
const node = FiberNode.create(document.getElementById("app")!)
console.log(node)
const destroy = render(<App
  contexts={[StyleContext.provide(StylisCreater)]} />,
  node,
  askTimeWork
);