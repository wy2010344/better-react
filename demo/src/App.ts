import { useContent, useDom } from "better-react-dom";
import usePanel from "./panel/usePanel";

export default function App() {
  useDom("div", {
    css: `
    width:800px;
    height:800px;
    display:flex;
    align-items:center;
    justify-content:center;
    background-image: url(https://picsum.photos/id/1080/6858/4574), linear-gradient(rgb(219, 166, 166), rgb(0, 0, 172));
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    position:relative;
    `,
    children() {
      useDom("div", {
        css: `
        width:200px;
        height:400px;
        border-radius:10px;
        position:relative;
        background:rgba(255,255,255,0.5);
        backdrop-filter: blur(10px);
        `,
        children() {
          useContent("使用backdrop-filter")
        }
      })
      useDom("div", {
        css: `
        width:200px;
        height:400px;
        border-radius:10px;
        position:relative;
        background:rgba(255,255,255,0.5);
        &::before{
          content:"";
          position:absolute;
          inset:0 0 0 0;
          background:inherit;
          filter:blur(10px);
        }
        `,
        children() {
          useContent("使用filter")
        }
      })
    }
  })

  useDom("div", {
    css: ` 
      width:100px;
      height:100px;
      border:4px solid aquamarine;
      background-color:#222;
      overflow:hidden;
      border-radius:50%;
      display:flex;
      justify-content:center;
      align-items:center;
      filter:blur(6px) contrast(6);

      @keyframes move{
        from {
          transform:translate(-100px);
        }
        to {
          transform:translate(100px)
        }
      }
    `,
    children() {
      useDom("div", {
        css: ` 
        width:1em;
        height:1em;
        transform:translate(0px,0px);
        background-color:aquamarine;
        animation: move 2s linear infinite;
        `
      })
    }
  })
}