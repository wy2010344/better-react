import { dom } from "better-react-dom";
import { renderPage } from "../util/page";
import { useChange, useMemo } from "better-react-helper";
import { renderInput } from "better-react-dom-helper";
import { faker } from "@faker-js/faker";
import { emptyArray } from "wy-helper";

/**
 * https://www.youtube.com/watch?v=8rtmvwUVZnc
 */
export default function () {
  renderPage({
    title: "bookview"
  }, function () {

    const { cover, left, right } = useMemo(() => {

      return {
        cover: faker.image.url({
          width: 150,
          height: 200
        }) + "?v=1",
        left: faker.image.url({
          width: 150,
          height: 200
        }) + "?v=2",
        right: faker.image.url({
          width: 150,
          height: 200
        }) + "?v=3"
      }
    }, emptyArray)
    const [step, setStep] = useChange(0)
    dom.div({
      style: `
      perspective:300px;
      position:relative;
      transform:translateX(${step * 50 / 180}%);
      `
    }).render(function () {

      renderImage({
        style: `
        position:absolute;
        inset:0;
        box-shadow:5px 4px 6px 0px #b0a1a1;
          `,
        src: right,
        content: "right"
      })
      dom.div({
        style: `
        position:relative;
        transform: translateX(-100%) rotateY(${180 - step}deg);
        transform-origin:right;
        transform-style: preserve-3d;
        `
      }).render(function () {

        //封面
        renderImage({
          style: `
        position:absolute;
        inset:0;
        backface-visibility:hidden;
        transform:rotateY(180deg);
        box-shadow:5px 4px 6px 0px #b0a1a1;
          `,
          src: cover,
          content: "cover"
        })
        //左边图
        renderImage({
          style: `
        backface-visibility:hidden;
          `,
          src: left,
          content: "left"
        })
      })
    })
    renderInput("input", {
      type: "range",
      min: 0,
      max: 180,
      step: 1,
      value: step + "",
      style: `
      align-self:stretch;
      `,
      onValueChange(e) {
        setStep(Number(e))
      },
    })
  })
}


function renderImage({
  style,
  content,
  src
}: {
  style: string
  src: string
  content: string
}) {
  dom.div({
    style: `
    position:relative;
    ${style}
    `
  }).render(function () {
    dom.img({
      src,
      style: `
      display:block;
      `
    }).render()
    dom.div({
      style: `
      position:absolute;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      `
    }).render(function () {
      dom.span({
        style: `
        background:white;
        `
      }).renderText`${content}`
    })
  })
}