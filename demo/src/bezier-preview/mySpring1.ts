import { dom } from "better-react-dom";
import { useChange, useEffect } from "better-react-helper";
import { SetValue, emptyArray, springBase, springIsStop } from "wy-helper";
import { renderInput } from "better-react-dom-helper";
import { SpringOptions } from "./spring";



function renderRange(label: string, value: number, setValue: SetValue<number>, args?: {
  min?: number
  max?: number
  step?: number
}) {
  dom.div({
    style: `
    display:flex;
    align-items:center;
    `
  }).render(function () {
    dom.label().renderText`${label}:`
    renderInput("input", {
      type: "range",
      ...args,
      value: value + "",
      onValueChange(v) {
        setValue(Number(v))
      }
    })
    dom.span().renderText`${value}`
  })
}

export default function () {
  dom.div({
    style: `
    display:flex;
    align-items:center;
    justify-content:center;
    flex-direction:column;
    background:yellow;
    height:100%;
    `
  }).render(function () {
    const [zta, setZta] = useChange(1)
    const [omega0, setOmega0] = useChange(6)
    const [velocity, setVelocity] = useChange(0)
    renderRange("omega0", omega0, setOmega0)
    renderRange("zta", zta, setZta, {
      max: 2,
      step: 0.1
    })
    renderRange("velocity", velocity, setVelocity, {
      max: 100,
      step: 1,
      min: -100
    })
    const canvas = dom.canvas({
      width: 800,
      height: 800,
      style: `
      background:white;
      `
    }).render()

    useEffect(() => {
      const ctx = canvas.getContext('2d')!;

      const width = canvas.width;
      const height = canvas.height;

      function drawSpringAnimation(
        spring: (n: number) => number,
        color: string,
        offsetY: number) {
        const deltaTime = 16.67; // Approx. 60 FPS
        ctx.beginPath();
        ctx.moveTo(0, height / 2 + offsetY);
        for (let t = 0; t < 3000; t += deltaTime) {

          const position = spring(t / 1000)

          const x = (t / 3000) * width;
          const y = height / 2 + offsetY - position * 100; // Scale position for visibility
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = color;
        ctx.stroke();
      }

      ctx.clearRect(0, 0, width, height);
      let stopObj: {
        t: number
      } | undefined = undefined


      drawSpringAnimation(t => {
        const v = springBase(
          t,
          0,
          velocity,
          {
            zta,
            omega0,
          })
        if (!stopObj) {
          if (springIsStop(v)) {
            stopObj = {
              t: t
            }
          }
        }
        return 1 - v.displacement
      }, 'green', 0)

      drawSpringAnimation(t => {
        const v = springBase(
          t,
          0,
          velocity,
          {
            zta,
            omega0, velocityWhenZta1Plus: true
          })
        return v.velocity
      }, 'red', 0)


      if (stopObj) {
        const t = (stopObj as any).t
        ctx.beginPath();
        const x = (t * 1000 / 3000) * width
        console.log("stop", stopObj, x)
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.strokeStyle = "black";
        ctx.stroke();
      }
      // // const spring = springReanimated(config)
      // function draw(getSpring: (o: SpringOptions) => (n: number) => number, o: number) {
      //   // Draw underdamped spring
      //   drawSpringAnimation(getSpring(configUnderdamped), 'blue', o);

      //   // Draw critically damped spring
      //   drawSpringAnimation(getSpring(configCriticallyDamped), 'green', o);

      //   // Draw overdamped spring
      //   drawSpringAnimation(getSpring(configOverdamped), 'red', o);
      // }

      // // draw(c => n => jc(c)(n).velocity, 0)
      // draw(c => n => jc(c)(n).value, 0)
      // draw(springMotion, 0)


    }, [zta, omega0, velocity])
  })
}
