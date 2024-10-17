import { Better } from "better-react-dom-helper";
import { imgs } from "../imgs";
import { addEffectDestroy, useHookEffect, useRef } from "better-react-helper";
import { animate, scroll } from "motion";
import { emptyArray } from "wy-helper";

export default function () {
  const articleRef = useRef<HTMLElement | null>(null);
  useHookEffect(() => {
    articleRef.current!.querySelectorAll("section > div").forEach((item) => {
      addEffectDestroy(
        scroll(
          animate(item, {
            opacity: [0, 1, 1, 0],
          }),
          {
            target: item,
            /**
             * 将进入,完全进入,将退出,完全退出
             */
            offset: ["start end", "end end", "start start", "end start"],
          }
        )
      );
    });
  }, emptyArray);
  Better.renderChild(
    <article ref={articleRef}>
      {imgs.map((img, i) => {
        return (
          <section
            key={i}
            className="h-[100vh] flex justify-center items-center"
          >
            <div className="w-[300px] h-[300px] overflow-hidden m-[20px] bg-white">
              <img src={img} className="w-[300px] h-[300px]" />
            </div>
          </section>
        );
      })}
    </article>
  );
}
