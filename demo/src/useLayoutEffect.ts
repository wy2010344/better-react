import { dom } from "better-react-dom";
import { renderArray, renderIf, renderMap, useChange, useEffect } from "better-react-helper";
import { Point, arrayCountCreateWith, emptyArray, quote } from "wy-helper";


const vs = arrayCountCreateWith(3000, c => {
  return c
})
export default function () {

  // useEffect(() => {
  //   const handleScroll = () => {
  //     // 平滑滚动到容器顶部
  //     container.scrollTo({
  //       top: 0,
  //       behavior: 'smooth',
  //     });
  //   };
  //   // 当组件被挂载时滚动到顶部
  //   handleScroll();
  //   // 添加事件侦听器以在后续滚动时滚动到顶部
  //   window.addEventListener('scroll', handleScroll);
  //   return () => {
  //     window.removeEventListener('scroll', handleScroll);
  //   };
  // }, []);
  // const container = dom.div({
  //   style: `
  //   `
  // }).renderFragment(() => {

  //   renderArray(vs, quote, function (i) {
  //     dom.div({
  //       style: `
  //   height:50px;
  //   `
  //     }).renderText`${i}`
  //   })
  // })

  const [show, setShow] = useChange(false)
  dom.button({
    onClick() {
      setShow(!show)
    }
  }).renderText`to ${(!show) + ''}`

  renderIf(show, () => {

    /**
     * 现在使用layout不明显了?....
     * @param withLayout 
     */
    function ab(withLayout?: boolean) {
      const [op, setOp] = useChange(1)
      dom.div({
        style: `
      width:100px;
      height:100px;
      background:green;
      opacity:${op};
      `
      }).render()
      useEffect((e) => {
        if (withLayout) {
          //使用realtime两个都会影响到
          // setOp(0.1)
          // e.setRealTime()
          //使用layoutEffect只影响到一个
          e.layoutEffect(() => {
            setOp(0.1)
          })
        } else {
          setOp(0.1)
        }
      }, []);
      let f = Date.now()
      let n = 0
      while (n < 2000) {
        n = Date.now() - f
      }
    }
    ab()
    ab(true)
  })

}


function d2() {



  dom.div({
    style: `
    width:100%;
    height:100%;
    background:gray;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-direction:column;
    gap:10px;
    `
  }).renderFragment(function () {


    const [p, setP] = useChange<Point | undefined>(undefined)
    const b1 = dom.button({
      onPointerLeave() {
        setP(undefined)
      },
      onPointerEnter(e) {
        const rect = b1.getBoundingClientRect();
        setP({
          x: rect.left,
          y: rect.top
        });
      },
    }).renderText`above`

    dom.button().renderText`below`

    const [th, setTh] = useChange(0)

    console.log("render", th)
    const toolTip = dom.div({
      style: `
      position:fixed;
      background:red;
      padding:30px;
      ${p ? `
      top:${p.y - th}px;
      left:${p.x}px;
      `: `
      display:none;
      `}
      `
    }, true).renderText`this is the tooltip ${th}`

    useEffect((e) => {
      if (p) {
        setTh(toolTip.clientHeight)
      } else {
        setTh(0)
      }
    }, [p])
    // console.log(toolTip)
    useEffect(() => {
      document.body.appendChild(toolTip)
    }, emptyArray)
  })
}