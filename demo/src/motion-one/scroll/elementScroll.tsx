import { Better } from "better-react-dom-helper";
import { addEffectDestroy, useHookEffect, useRef } from "better-react-helper";
import { animate, scroll } from "motion";
import { arrayCountCreateWith, emptyArray } from "wy-helper";

export default function () {
  const ref = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const carouselRef = useRef<HTMLUListElement | null>(null);
  useHookEffect(() => {
    const carousel = carouselRef.current!;
    addEffectDestroy(
      scroll(animate(ref.current!, { scaleX: [0, 1] }), {
        // target: carousel.querySelector("li")!,
        container: carousel,
        axis: "x",
      })
    );
    addEffectDestroy(
      scroll(
        ({ x }) => (progressRef.current!.innerHTML = x.progress.toFixed(2)),
        {
          container: carousel,
          //虽然同时使用有值,但不合预期?没有达到1
          // target: carousel.querySelector("li")!,
          axis: "x",
        }
      )
    );
  }, emptyArray);
  Better.renderChild(
    <>
      <div
        ref={ref}
        className="fixed left-0 right-0 top-0 bg-red-400 h-[10px] origin-left"
      ></div>
      <div ref={progressRef} className="fixed bottom-[10px] bg-red-400"></div>
      <ul
        ref={carouselRef}
        className="w-full h-[150px] max-w-[400px] overflow-x-scroll p-[10px] flex items-stretch"
      >
        {arrayCountCreateWith(10, (i) => {
          return (
            <li
              key={i}
              className="rounded-[10px] ml-5 bg-black w-[150px] flex-shrink-0"
            />
          );
        })}
      </ul>
    </>
  );
}
