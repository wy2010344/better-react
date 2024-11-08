import { dom } from "better-react-dom";
import { renderPage } from "../util/page";
import { BuildValueCenters, cubicBezier, emptyArray, extrapolationClamp, GetDeltaXAnimationConfig, getInterpolate, getSpringBaseAnimationConfig, getTweenAnimationConfig, GetValue, getZtaAndOmega0From, quote, Quote, ReadValueCenter, SetValue, syncMergeCenter, syncMergeCenterArray, trackSignal, ValueCenter } from "wy-helper";
import { animate } from "motion";
import { useComputed, useConst, useEffect, useMemo, useSignal, useSignalSync, useValueCenter } from "better-react-helper";
import { useAnimateFrame, useAnimateSignal } from "better-react-dom-helper";
import { animateFrame } from "wy-dom-helper";
const APPS = [
  'Safari',
  'Mail',
  'Messages',
  'Photos',
  'Notes',
  'Calendar',
  'Reminders',
  'Music',
];

const DISTANCE = 110; // pixels before mouse affects an icon
const SCALE = 2.25; // max scale factor of an icon
const NUDGE = 40; // pixels icons are moved away from mouse

const sp = getSpringBaseAnimationConfig({
  config: getZtaAndOmega0From(170, 12, 0.1)
})
const gp = getInterpolate({
  0: 0,
  40: -40
}, extrapolationClamp)

const scaleMap = getInterpolate({
  [-DISTANCE]: 1,
  0: SCALE,
  [DISTANCE]: 1
}, extrapolationClamp)

function toPx(n: number) {
  return n + 'px'
}
export default function () {

  renderPage({
    title: "mangnified-dock"
  }, () => {
    const mouseLeft = useSignal(-Infinity)
    const mouseRight = useSignal(-Infinity)

    const left = useAnimateSignal(() => {
      return gp(mouseLeft.get())
    })
    const right = useAnimateSignal(() => {
      return gp(mouseRight.get())
    })
    dom.div({
      className: "z-0 mx-auto hidden h-16 items-end gap-3 px-2 pb-3 sm:flex relative",
      onMouseMove(e) {
        const { left, right } = e.currentTarget.getBoundingClientRect();
        const offsetLeft = e.clientX - left;
        const offsetRight = right - e.clientX;
        mouseLeft.set(offsetLeft);
        mouseRight.set(offsetRight);
      },
      onMouseLeave(e) {
        mouseLeft.set(-Infinity);
        mouseRight.set(-Infinity);
      }
    }).render(() => {
      dom.div({
        className: " absolute rounded-2xl inset-y-0 bg-gray-700 border border-gray-600 -z-10",
        style: {
          left: useSignalSync(() => left() + 'px'),
          right: useSignalSync(() => right() + "px")
        }
      }).render()
      APPS.forEach(app => {
        let inited = false

        const distance = useComputed(() => {
          if (inited) {
            return mouseLeft.get() - btn.offsetLeft - btn.offsetWidth / 2;
          } else {
            return mouseLeft.get()
          }
        })

        const scaleBase = useComputed(() => {
          return scaleMap(distance())
        })

        const scale = useAnimateSignal(scaleBase)

        const x = useAnimateSignal(() => {
          const d = distance();
          if (d === -Infinity) {
            return 0;
          } else if (d < -DISTANCE || d > DISTANCE) {
            return Math.sign(d) * -1 * NUDGE;
          } else {
            return (-d / DISTANCE) * NUDGE * scaleBase();
          }
        })

        const y = useAnimateFrame(0)
        const btn = dom.button({
          className: "aspect-square block w-10 rounded-full bg-white shadow origin-bottom",
          style: {
            background: "red",
            // scale,
            transform: useSignalSync(() => {
              return `translate(${x()}px,${y.get()}px) scale(${scale()})`
            })
          },
          async onClick() {
            async function fun() {
              await y.animateTo(-40, getTweenAnimationConfig(0.7 / 2 * 1000, cubicBezier(0, 0, 0.2, 1)))
              await y.animateTo(0, getTweenAnimationConfig(0.7 / 2 * 1000, cubicBezier(0.8, 0, 1, 1)))
            }
            await fun()
            await fun()
            await fun()
          }
        }).render(() => {
          // dom.span({
          //   className: "bg-gray-700 shadow shadow-black border border-gray-600 px-2 py-1.5 text-sm rounded text-white font-medium"
          // }).renderTextContent(app)
        })
        inited = true
      })
    })
  })
}