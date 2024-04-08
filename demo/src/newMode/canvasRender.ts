import { dom, hookDraw, hookEvent, renderCanvas, renderSubCanvas } from "better-react-dom";
import { useVersion } from "better-react-helper";
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

      const [version, updateVersion] = useVersion()

      // 绘制黄色背景
      hookDraw.beginPath();
      hookDraw.fillStyle = "#ff6";
      hookDraw.fillRect(0, version, canvas.width, canvas.height);
      console.log("render", version)
      hookEvent(0, 0, canvas.width, canvas.height, {
        pointerdown(e) {
          updateVersion()
          console.log("pointerDown", e)
        }
      })
      // 绘制蓝色三角形
      hookDraw.beginPath();
      hookDraw.fillStyle = "blue";
      hookDraw.moveTo(20 + version, 20);
      hookDraw.lineTo(180, 20);
      hookDraw.lineTo(130, 130);
      hookDraw.closePath();
      hookDraw.fill();

      renderSubCanvas(20, 20, 100, 100, arrayNotEqualDepsWithEmpty, function () {


        const [version, updateVersion] = useVersion()
        // 清除一部分画布
        hookDraw.clearRect(10, 10, 120, 100);

        hookEvent(10, 10, 120, 100, {
          pointerdown(e) {
            updateVersion()
          }
        })
        console.log("render---", version)
        hookDraw.font = "48px serif";
        hookDraw.strokeText("Hello world", 10 + version, 50);
      }, emptyArray)
    }, emptyArray)
  })
}