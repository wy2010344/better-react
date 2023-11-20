import { faker } from "@faker-js/faker";
import { dom } from "better-react-dom";

export function renderTransformZ() {


  dom.div({
    style: `
    width:100%;
    aspect-ratio:1/1;
    position:relative;
    display:flex;
    align-items:center;
    justify-content:center;
    perspective:1000px;
    transform-style: preserve-3d;
    `
  }).render(function () {

    for (let i = 0; i < 3; i++) {
      dom.div({
        style: `
        width:100px;
        height:100px;
        position:absolute;
        transform:translateZ(${4 - i}0px) rotateX(${faker.number.int({
          max: 360
        })}deg) rotateY(${faker.number.int({
          max: 360
        })}deg) rotateZ(${faker.number.int({
          max: 360
        })}deg);
        background:${faker.color.rgb()};
        `
      }).render()
    }
  })
}