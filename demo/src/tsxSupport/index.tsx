import { arrayCountCreateWith, emptyArray, EmptyFun, quote } from "wy-helper";
import {
  useEffect,
  useRef,
  useValueCenter,
  useVersion,
} from "better-react-helper";
import { Better } from "better-react-dom-helper";
import { Counter } from "./Counter";
export default function index() {
  const [version, updateVersion] = useVersion();
  const ref = useRef<HTMLDivElement>(null);
  const v = useValueCenter(0);
  useEffect(() => {
    console.log("d", ref.current);
    const inv = setInterval(() => {
      v.set(v.get() + 1);
    }, 1000);
    return () => {
      clearInterval(inv);
    };
  }, emptyArray);
  const jsx = (
    <div>
      index{v}sdd
      <span>abc</span>
      sdd
      <div ref={ref}>ddd</div>
      <button
        className="btn btn-primary"
        onClick={() => {
          updateVersion();
        }}
      >
        <span>dd</span>c{version}x
      </button>
      {version % 2 ? (
        <div className="bg-green-500 text-red-400">abc</div>
      ) : (
        <>
          <button className="btn primary ">bcd</button>
          <Counter abc={999} />
        </>
      )}
      vdd
      {false}
      {true}
      {0}
      {""}
      {null}
      {undefined}
      <Counter abc={99}>
        {99}
        <div>98</div>
      </Counter>
      <>
        {arrayCountCreateWith(100, quote).map((row) => {
          return <div key={row}>ccc{row}</div>;
        })}
      </>
    </div>
  );
  Better.renderChild(jsx);
  // renderM();
}
