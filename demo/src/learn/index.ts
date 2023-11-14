import { useDom } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";
import { css } from 'stylis-creater'
import { useEffect } from "better-react-helper"

const images = [ //https://unsplash.com/@nicolehoneywill
  "https://images.unsplash.com/photo-1537886079430-486164575c54?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=4c747db3353a34b312d05786f47930d3&auto=format&fit=crop&w=600&q=60",
  "https://images.unsplash.com/photo-1537886194634-e6b923f92ff1?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=9eb2726071e58c1b0a430a75b1047525&auto=format&fit=crop&w=600&q=60",
  "https://images.unsplash.com/photo-1537886243959-0b504cf58aa2?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=1171ce40e6e68e663c3399a67a915913&auto=format&fit=crop&w=600&q=60",
  "https://images.unsplash.com/photo-1537886492139-052c27acbfee?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=664282a4bd8b8a69cc860420214df3e7&auto=format&fit=crop&w=600&q=60",
  "https://images.unsplash.com/photo-1537886464786-8a0d500b0da6?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=49984d393482456ea5484c3482cc52a9&auto=format&fit=crop&w=600&q=60"
]

function reorder(targetEl: HTMLInputElement, els: HTMLInputElement[]) {
  const nItems = els.length;
  let processedUncheck = 0;
  for (const el of els) {
    const containerEl = el.nextElementSibling as HTMLInputElement
    if (el === targetEl) {//checked radio
      containerEl.style.setProperty("--w", "100%");
      containerEl.style.setProperty("--l", "0");
    }
    else {//unchecked radios
      containerEl.style.setProperty("--w", `${100 / (nItems - 1)}%`);
      containerEl.style.setProperty("--l", `${processedUncheck * 100 / (nItems - 1)}%`);
      processedUncheck += 1;
    }
  }
}
/**
 * 参考点: https://codepen.io/ycw/pen/QVeYMP
 */
export default normalPanel(function () {

  useEffect(() => {
    const els = document.querySelectorAll("[type='radio']") as unknown as HTMLInputElement[];
    for (const el of els)
      el.addEventListener("input", e => reorder(e.target as HTMLInputElement, els));
    reorder(els[0], els);
  }, [])
  useDom("div", {
    className: cls,
    children() {
      images.map((image, n) => {
        useDom("input", {
          type: "radio",
          id: `c${n}`,
          name: "ts",
          onClick(event) {

          },
        })
        useDom("label", {
          className: "t",
          htmlFor: `c${n}`,
          children() {
            useDom("img", {
              src: image
            })
          },
        })
      })
    },
  })
})
const cls = css`
height:100%;
position: relative;
--barH:10%;
>.t{
  --w:20%;
  display: block;
  width: var(--w);
  height: var(--barH);
  position: absolute;
  bottom: 0;
  left: var(--l);
  transform-origin: top left;

  >img{
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(0.8);
  }
}
input[type="radio"]{
  //display: none;
  &:checked{
    +.t{
      left:0;
      bottom: var(--barH);
      height: calc(100% - var(--barH));

      >img{
        object-fit: contain;
      }
    }
  }
}
`

