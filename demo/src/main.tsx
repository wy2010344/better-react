
import { nestCss } from './drag/NestCss';
import DeskTop from './drag/deskTop';
import './style.css'
import { createElement, StyleContext } from 'better-react-dom'
import { render } from 'better-react'
import { FiberNode, askTimeWork } from 'better-react-dom';
import Index from './Index';
import { StylisCreater } from 'stylis-creater';
import TestFix from './TestFix';
import { ScheduleAskTime } from './schedule';
import { askIdleTimeWork } from './scheduleIdle';


function App() {
  //return <>aaaa</>
  StyleContext.useProvider(StylisCreater)
  //return <TestFix />
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
const destroy = render(<App />,
  node,
  //askTimeWork,
  //askIdleTimeWork,
  ScheduleAskTime
);