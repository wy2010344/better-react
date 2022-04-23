import { RouteFun } from "..";
import PanelReact from "../../drag/PanelReact";
import { useEffect } from "better-react";
import { useRef, useState } from "better-react-helper";
import { animationOf, Animation, springAnimationOf } from "./Animation";

const animation: RouteFun<void> = ({ close, moveToFirst }) => {
  return <PanelReact moveFirst={moveToFirst}
    initWidth={800}
    close={close}
    title="动画">{x => {
      return <>
        <ViewAnimation />
      </>
    }}</PanelReact>
}

const allAnimation = Animation as any

type TweenModel = {
  name: string
  eases?: string[]
}
const allTweens: TweenModel[] = Object.entries(Animation).map(function ([k, v]) {
  return {
    name: k,
    ...(typeof (v) == 'function'
      ? {}
      : {
        eases: Object.keys(v)
      }
    )
  }
})

type ViewCallBack = (duration: number, max: number, call: (y: number, t: number) => void) => Promise<void>
function ViewAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | undefined>(undefined)
  const [viewCallBack, setViewCallBack] = useState<ViewCallBack | undefined>(undefined)
  useEffect(() => {
    if (!viewCallBack) {
      return
    }
    const canvas = canvasRef()!
    console.log(canvas)
    const ctx = canvas.getContext("2d")!,
      W = canvas.width,
      H = canvas.height;
    let isRunning = false;

    ctx.lineWidth = 2;
    if (isRunning) return;
    const duration = 1000,
      yLen = 300,
      xLen = 500,
      space = xLen / duration,
      pos: any[] = [],
      gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);

    gradient.addColorStop(0, "hsl(200,100%,85%)");
    gradient.addColorStop(1, "hsl(200,100%,50%)");

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "hsl(200,50%,50%)";
    ctx.moveTo(10, 50);
    ctx.lineTo(10, 350);
    ctx.lineTo(510, 350);
    ctx.lineTo(510, 50);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    function orbit() {
      ctx.save();
      ctx.translate(10, 350);
      ctx.strokeStyle = "hsl(30,100%,50%)";
      ctx.beginPath();
      ctx.clearRect(0, -450, 500, 49);
      ctx.clearRect(0, -300, 500, 300);
      ctx.clearRect(0, 1, 500, 50);
      ctx.moveTo(0, 0);
      pos.forEach(function (n, i) {
        ctx.lineTo(n.x, n.y);
      });
      ctx.stroke();
      ctx.restore();
    }

    function ball(y: number) {
      ctx.save();
      ctx.clearRect(520, 0, 90, 400);
      ctx.translate(540, 350 - y);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.restore();
    }


    viewCallBack(duration, yLen, (y, t) => {
      pos.push({ x: t * space, y: -y });
      orbit();
      ball(y);
    }).then(() => {
      isRunning = false
    })
  }, [viewCallBack])

  return <div>
    <canvas ref={canvasRef} width={600} height={400} />
    <TweenAnimation setFun={setViewCallBack} />
    <SpringAnimation setFun={setViewCallBack} />
  </div>
}

function TweenAnimation({
  setFun
}: {
  setFun(fn: ViewCallBack): void
}) {
  const [currentTween, setCurrentTween] = useState<TweenModel>(allTweens[0])
  const [currentEasy, setCurrentEasy] = useState(allTweens[0].eases?.[0] || "")
  useEffect(() => {
    function fnName(t: string, e: string) {
      const an = allAnimation[t]
      if (an) {
        return typeof an == "function" ? an : an[e];
      }
    }
    const fn = fnName(currentTween.name, currentEasy)
    if (!fn) {
      return
    }
    setFun(async (duration, max, call) => {
      return new Promise(resolve => {
        animationOf({
          duration,
          max,
          call,
          change: fn,
          end: resolve
        })
      })
    })
  }, [currentTween, currentEasy])
  return <>
    <div>
      <div>Tween类型:{currentTween.name}</div>
      {allTweens.map(tween => (<span key={tween.name}>
        <input
          type="radio"
          name="tween"
          checked={currentTween.name == tween.name}
          onClick={() => {
            setCurrentTween(tween)
          }} />
        {tween.name}
      </span>))}
      <input type="radio"
      />
    </div>
    {currentTween.eases && <div>
      <div>Ease类型 {currentEasy}</div>
      {currentTween.eases?.map(easy => <span
        key={easy}
      >
        <input
          type="radio"
          name="easy"
          checked={currentEasy == easy}
          onClick={() => {
            setCurrentEasy(easy)
          }} />
        {easy}
      </span>)}
    </div>}
  </>

}


function SpringAnimation({
  setFun
}: {
  setFun(fn: ViewCallBack): void
}) {
  const [stiffness, setStiffness] = useState(170)
  const [mass, setMass] = useState(1)
  const [damping, setDamping] = useState(26)
  return <>
    <InputRange
      title="刚度"
      max={1000}
      value={stiffness}
      setValue={setStiffness} />
    <InputRange
      title="质量"
      value={mass}
      setValue={setMass} />
    <InputRange
      title="摩擦系数"
      value={damping}
      setValue={setDamping} />
    <button onClick={() => {
      setFun(async (duration, max, call) => {
        return new Promise(resolve => {
          springAnimationOf({
            stiffness,
            mass,
            damping,
            max,
            update(x, v, t) {
              ///console.log(x, v)
              call(x, t)
            },
            finish: resolve
          })
        })
      })
    }}>SpringView</button>
  </>
}

function InputRange({
  title,
  max,
  value,
  setValue
}: {
  max?: number
  title: string
  value: number,
  setValue(v: number): void
}) {
  return <div>
    {title}
    <input type="range"
      value={value}
      min={1} max={max || 100}
      onChange={e => {
        setValue(Number(e.target.value))
      }} />
    {value}
  </div>
}
export default animation


/**
 * 其它,如转盘动画
 * https://lifuzhen.github.io/2019/06/22/react%E5%AE%9E%E7%8E%B0%E6%8A%BD%E5%A5%96%E5%A4%A7%E8%BD%AC%E7%9B%98/
 * 还有九宫格
 * 很暴力,先加速,再匀速,再减速
 */