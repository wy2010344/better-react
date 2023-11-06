import { useEffect } from "better-react";
import { useDom, React } from "better-react-dom";
import { Direction, initDrag, ResizeHelper } from "./drag";
import { stringifyStyle } from "better-react-dom-helper";


export default function useResize(resize: ResizeHelper) {
  function makeDrag(dom: HTMLElement, dir: Direction) {
    useEffect(() => {
      return initDrag(dom, {
        // start(e) {
        //   e.preventDefault()
        //   e.stopPropagation()
        // },
        move(e) {
          e.preventDefault()
          e.stopPropagation()
        },
        // end(e) {
        //   e.preventDefault()
        //   e.stopPropagation()
        // },
        diff: resize(dir),
      })
    }, [])
  }
  makeDrag(useDom("div", {
    style: stringifyStyle({
      width: "100%",
      height: "7px",
      position: "absolute",
      top: "-3px",
      left: "0",
      cursor: "n-resize"
    })
  }), { t: true })
  makeDrag(useDom("div", {
    style: stringifyStyle({
      width: "7px",
      height: "100%",
      position: "absolute",
      right: "-3px",
      top: "0",
      cursor: "e-resize"
    }),
  }), { r: true })
  makeDrag(useDom("div", {
    style: stringifyStyle({
      width: "7px",
      height: "100%",
      position: "absolute",
      left: "-3px",
      top: "0",
      cursor: "w-resize"
    })
  }), { l: true })
  makeDrag(useDom("div", {
    style: stringifyStyle({
      width: "100%",
      height: "7px",
      position: "absolute",
      bottom: "-3px",
      left: "0",
      cursor: "s-resize"
    }),
  }), { b: true })
  makeDrag(useDom("div", {
    style: stringifyStyle({
      width: "15px",
      height: "15px",
      position: "absolute",
      top: "-7px",
      left: "-7px",
      cursor: "nw-resize"
    }),
  }), { t: true, l: true })
  makeDrag(useDom("div", {
    style: stringifyStyle({
      width: "15px",
      height: "15px",
      position: "absolute",
      top: "-7px",
      right: "-7px",
      cursor: "ne-resize"
    }),
  }), { t: true, r: true })
  makeDrag(useDom("div", {
    style: stringifyStyle({
      width: "15px",
      height: "15px",
      position: "absolute",
      bottom: "-7px",
      left: "-7px",
      cursor: "sw-resize"
    }),
  }), { b: true, l: true })
  makeDrag(useDom("div", {
    style: stringifyStyle({
      width: "15px",
      height: "15px",
      position: "absolute",
      bottom: "-7px",
      right: "-7px",
      cursor: "se-resize"
    })
  }), { b: true, r: true })
}
