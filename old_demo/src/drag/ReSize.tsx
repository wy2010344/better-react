import { React } from 'better-react-dom';
import { Direction } from './drag';

export default function ReSize({
  resize
}: {
  resize(e: React.MouseEvent, dir: Direction): void
}) {
  function makeResize(dir: Direction) {
    return function (e: React.MouseEvent) {
      e = e || window.event as MouseEvent;
      resize(e, dir);
    };
  };
  return (
    <>
      <div style={{
        width: "100%",
        height: "7px",
        position: "absolute",
        top: "-3px",
        left: "0",
        cursor: "n-resize"
      }} onMouseDown={makeResize({ t: true })} />
      <div style={{

        width: "7px",
        height: "100%",
        position: "absolute",
        right: "-3px",
        top: "0",
        cursor: "e-resize"
      }} onMouseDown={makeResize({ r: true })} />
      <div style={{

        width: "7px",
        height: "100%",
        position: "absolute",
        left: "-3px",
        top: "0",
        cursor: "w-resize"
      }} onMouseDown={makeResize({ l: true })} />
      <div style={{

        width: "100%",
        height: "7px",
        position: "absolute",
        bottom: "-3px",
        left: "0",
        cursor: "s-resize"
      }} onMouseDown={makeResize({ b: true })} />
      {/**4个角 */}
      <div style={{

        width: "15px",
        height: "15px",
        position: "absolute",
        top: "-7px",
        left: "-7px",
        cursor: "nw-resize"
      }} onMouseDown={makeResize({ t: true, l: true })} />
      <div style={{

        width: "15px",
        height: "15px",
        position: "absolute",
        top: "-7px",
        right: "-7px",
        cursor: "ne-resize"
      }} onMouseDown={makeResize({ t: true, r: true })} />
      <div style={{

        width: "15px",
        height: "15px",
        position: "absolute",
        bottom: "-7px",
        left: "-7px",
        cursor: "sw-resize"
      }} onMouseDown={makeResize({ b: true, l: true })} />
      <div style={{

        width: "15px",
        height: "15px",
        position: "absolute",
        bottom: "-7px",
        right: "-7px",
        cursor: "se-resize"
      }} onMouseDown={makeResize({ b: true, r: true })} />
    </>
  )
}
