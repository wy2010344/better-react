import Better from './better-react'
import { createSharePortal } from './better-react-helper/SharePortal';
import { useState } from './better-react/fc';
import { Demo } from './demo';
import DeskTop from './drag/deskTop';
import PanelMve from './drag/PanelMve';
import './style.css'



function App() {
  return <DeskTop />
  //return <Demo />
}

Better.render(<App />, document.getElementById("app")!);