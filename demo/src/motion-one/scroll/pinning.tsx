import { Better } from "better-react-dom-helper";
import { imgs } from "../imgs";
import {
  addEffectDestroy,
  useEffect,
  useHookEffect,
  useRef,
} from "better-react-helper";
import { emptyArray } from "wy-helper";
import { animate, scroll } from "motion";

export default function () {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  useHookEffect(() => {
    const section = sectionRef.current!;
    const ul = section.querySelector("ul")!;
    const progress = progressRef.current!;
    addEffectDestroy(
      scroll(
        animate(ul, {
          transform: ["none", `translateX(-${imgs.length - 1}00vw)`],
        }),
        { target: section }
      )
    );
    addEffectDestroy(
      scroll(animate(progress, { scaleX: [0, 1] }), {
        target: section,
      })
    );
  }, emptyArray);
  Better.renderChild(
    <>
      <article>
        <header className="h-[80vh] flex items-center justify-center bg-red-400 text-white">
          <h1 className="text-[56px] font-bold text-center">Lines of London</h1>
        </header>
        <section ref={sectionRef} className="h-[500vh] relative">
          <ul className="sticky top-0 flex">
            {imgs.map((img, i) => {
              return (
                <li
                  key={i}
                  className="flex w-[100vw] h-[100vh] flex-shrink-0 items-center justify-center flex-col overflow-hidden"
                >
                  <img src={img} className="w-[300px] h-[400px]" />
                  <h2 className="m-0 text-red-400 text-[50px] font-bold relative bottom-[30px]">
                    #00{i + 1}
                  </h2>
                </li>
              );
            })}
          </ul>
        </section>
        <footer className="h-[80vh] flex items-center justify-center bg-red-400 text-white">
          <p>
            Photos by
            <a target="_blank" href="https://twitter.com/mattgperry">
              Matt Perry
            </a>
          </p>
        </footer>
      </article>
      <div
        ref={progressRef}
        className="fixed left-0 right-0 h-[5px] bottom-[50px] bg-red-400"
      ></div>
    </>
  );
}
