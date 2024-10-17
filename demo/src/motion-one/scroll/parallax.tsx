import { Better } from "better-react-dom-helper";
import { imgs } from "../imgs";
import { addEffectDestroy, useHookEffect, useRef } from "better-react-helper";
import { emptyArray } from "wy-helper";
import { animate, scroll } from "motion";
export default function () {
  const articleRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  useHookEffect(() => {
    addEffectDestroy(scroll(animate(progressRef.current!, { scaleX: [0, 1] })));

    articleRef.current!.querySelectorAll("section").forEach((section) => {
      const header = section.querySelector("h2")!;
      addEffectDestroy(
        scroll(animate(header, { y: [-400, 400] }), {
          target: header,
        })
      );
    });
  }, emptyArray);
  Better.renderChild(
    <article ref={articleRef}>
      {imgs.map((img, i) => {
        return (
          <section
            key={i}
            className="h-[100vh] snap-start flex justify-center items-center relative"
          >
            <div className="w-[300px] h-[300px] m-[20px] bg-white overflow-hidden">
              <img src={img} className="w-[300px] h-[300px]" />
              <h2 className="font-bold text-[50px] absolute top-[calc(50%-25px)] left-[50%+120px] text-red-400">
                #00{i + 1}
              </h2>
            </div>
          </section>
        );
      })}
      <div
        ref={progressRef}
        className="fixed left-0 right-0 h-[5px] bg-red-400 bottom-[50px]"
      ></div>
    </article>
  );
}
