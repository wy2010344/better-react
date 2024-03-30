import { dom } from "better-react-dom";
import { hookDraw, hookEvent, renderCanvas } from "./canvas";
import { arrayNotEqualDepsWithEmpty, emptyArray } from "wy-helper";




export default function () {

  dom.div({
    style: `
    background:green;
    `
  }).renderFragment(function () {

    const canvas = dom.canvas({
      width: 300,
      height: 400
    }).render()


    renderCanvas(canvas, arrayNotEqualDepsWithEmpty, function () {


      // 绘制黄色背景
      hookDraw.beginPath();
      hookDraw.fillStyle = "#ff6";
      hookDraw.fillRect(0, 0, canvas.width, canvas.height);

      hookEvent(0, 0, canvas.width, canvas.height, {
        pointerdown(e) {
          console.log("pointerDown", e)
        }
      })
      // 绘制蓝色三角形
      hookDraw.beginPath();
      hookDraw.fillStyle = "blue";
      hookDraw.moveTo(20, 20);
      hookDraw.lineTo(180, 20);
      hookDraw.lineTo(130, 130);
      hookDraw.closePath();
      hookDraw.fill();

      // 清除一部分画布
      hookDraw.clearRect(10, 10, 120, 100);

      hookEvent(10, 10, 120, 100, {
        pointerdown(e) {
          console.log("pointerDown11", e)
        }
      })

    }, emptyArray)
  })
}