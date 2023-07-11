import { renderContent, useDom } from "better-react-dom";
import { css } from "stylis-creater";
import { normalPanel } from "../panel/PanelContext";
import { animate } from 'motion'
import { renderIf, useState, useMemo } from "better-react-helper"
import { MotionProps, useMotionDom } from "./MotionDOM";


export default normalPanel(function (operate, id) {
  const [open, setOpen] = useState(false)
  useDom("button", {
    onClick() {
      setOpen(!open)
    },
    children() {
      renderContent("切换开关")
    }
  })
  const [length, setLength] = useState(100)
  useDom("button", {
    onClick() {
      setLength(length + 10)
    },
    children() {
      renderContent("增加要素")
    }
  })
  const boxProps: MotionProps = useMemo(() => {
    return {
      enter: {
        height: length + 'px'
      },
      exit: {
        height: '0px'
      }
    }
  }, [length])
  // renderIf(open, () => {
  //   const div = useMotionDom("div", boxProps, {
  //     className: box,
  //     style: {
  //       height: '0px'
  //     },
  //     onClick() {
  //       animate(div, {
  //         transform: "rotate(45deg)"
  //       }, {
  //         duration: 0.5
  //       })
  //     }
  //   })
  // })


  renderIf(open, () => {
    useMotionDom("div", {
      layoutID: "abcd",
      enter: {
        x: '50%',
        y: 0
      },
      enterOption: {
        duration: 2
      }
    }, {
      style: {
        width: "100px",
        height: "100px",
        background: "green"
      }
    })
  }, () => {
    useMotionDom("div", { layoutID: "abcd" }, {
      style: {
        position: 'absolute', right: "10px", bottom: "20px",
        width: "10px",
        height: "10px",
        borderRadius: '50%',
        backgroundColor: "gray"
      }
    })
  })
})


const box = css`
  width: 100px;
  height: 100px;
  border-radius: 10px;
  background-color:#00ffdb;
`