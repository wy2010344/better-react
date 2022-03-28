
import { nestCss } from 'better-react-helper';
import DeskTop from './drag/deskTop';
import './style.css'
import { createElement } from 'better-react-dom'
import { render } from 'better-react'
import { FiberNode } from 'better-react-dom';
import { askTimeWork } from '../dom/src/askTimeWork';
import Index from './Index';

function App() {
  return <Index />
  //return <DeskTop />
  //return <Demo />
}

render(<App styleCreater={nestCss} />, FiberNode.create(document.getElementById("app")!,), askTimeWork);