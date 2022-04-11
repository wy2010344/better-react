
import { nestCss } from './drag/NestCss';
import DeskTop from './drag/deskTop';
import './style.css'
import { createElement, StyleContext } from 'better-react-dom'
import { render, Fragment } from 'better-react'
import { FiberNode } from 'better-react-dom';
import { askTimeWork } from '../../dom/src/askTimeWork';
import Index from './Index';
import { StylisCreater } from 'stylis-creater';


function App() {
  //return <>aaaa</>
  return <Index />
  //return <DeskTop />
  //return <Demo />
}
render(<App contexts={[StyleContext.provide(StylisCreater)]} />, FiberNode.create(document.getElementById("app")!,), askTimeWork);