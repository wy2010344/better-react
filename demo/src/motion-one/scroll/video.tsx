import { Better } from "better-react-dom-helper";
import { imgs } from "../imgs";
import { addEffectDestroy, useHookEffect, useRef } from "better-react-helper";
import { animate, scroll } from "motion";
import { emptyArray } from "wy-helper";

export default function () {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  useHookEffect(() => {
    const video = videoRef.current!;
    video.pause();
    addEffectDestroy(
      scroll(
        ({ y }) => {
          if (!video.readyState) return;
          video.currentTime = video.duration * y.progress;
        },
        {
          target: articleRef.current!,
          offset: ["-200px", "end end"],
        }
      )
    );
  }, emptyArray);
  Better.renderChild(
    <article>
      <h1 className="mx-[100px] text-[56px] font-bold">
        Video scroll scrub demo
      </h1>
      <div
        className="w-[400px] h-[225px] box-content
      backdrop-fiter:blur-[4px] backdrop-filter:brightness-[150]
      sticky top-[40px] my-[40px] mx-auto
      border-[80px] border-[#0d63f8ee]
      border-t-[40px] border-l-[40px]
      "
        style={{
          "--border-width": "40px",
        }}
      >
        <div
          className="before"
          style="display: block;
    position: absolute;
    top: calc(var(--border-width));
    left: calc(var(--border-width));
    right: calc(var(--border-width)* -1);
    bottom: calc(var(--border-width)* -1);
    background-color: transparent;
    background-image: radial-gradient(transparent 1px, black 1px);
    background-size: 5px 5px;"
        ></div>
        <video
          ref={videoRef}
          className="w-[400px] relative"
          muted
          playsInline
          loop
          src="https://d85hka1o93tql.cloudfront.net/tools-homepage.mp4"
        ></video>
      </div>
      <article ref={articleRef} className="max-w[500px] mx-auto gap-x-[30px]">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ac
          rhoncus quam.
        </p>
        <p>
          Fringilla quam urna. Cras turpis elit, euismod eget ligula quis,
          imperdiet sagittis justo. In viverra fermentum ex ac vestibulum.
          Aliquam eleifend nunc a luctus porta. Mauris laoreet augue ut felis
          blandit, at iaculis odio ultrices. Nulla facilisi. Vestibulum cursus
          ipsum tellus, eu tincidunt neque tincidunt a.
        </p>
        <h2>Sub-header</h2>
        <p>
          In eget sodales arcu, consectetur efficitur metus. Duis efficitur
          tincidunt odio, sit amet laoreet massa fringilla eu.
        </p>
        <p>
          Pellentesque id lacus pulvinar elit pulvinar pretium ac non urna.
          Mauris id mauris vel arcu commodo venenatis. Aliquam eu risus arcu.
          Proin sit amet lacus mollis, semper massa ut, rutrum mi.
        </p>
        <p>Sed sem nisi, luctus consequat ligula in, congue sodales nisl.</p>
        <p>
          Vestibulum bibendum at erat sit amet pulvinar. Pellentesque pharetra
          leo vitae tristique rutrum. Donec ut volutpat ante, ut suscipit leo.
        </p>
        <h2>Sub-header</h2>
        <p>
          Maecenas quis elementum nulla, in lacinia nisl. Ut rutrum fringilla
          aliquet. Pellentesque auctor vehicula malesuada. Aliquam id feugiat
          sem, sit amet tempor nulla. Quisque fermentum felis faucibus, vehicula
          metus ac, interdum nibh. Curabitur vitae convallis ligula. Integer ac
          enim vel felis pharetra laoreet. Interdum et malesuada fames ac ante
          ipsum primis in faucibus. Pellentesque hendrerit ac augue quis
          pretium.
        </p>
        <p>
          Morbi ut scelerisque nibh. Integer auctor, massa non dictum tristique,
          elit metus efficitur elit, ac pretium sapien nisl nec ante. In et ex
          ultricies, mollis mi in, euismod dolor.
        </p>
        <p>Quisque convallis ligula non magna efficitur tincidunt.</p>
        <p>
          Pellentesque id lacus pulvinar elit pulvinar pretium ac non urna.
          Mauris id mauris vel arcu commodo venenatis. Aliquam eu risus arcu.
          Proin sit amet lacus mollis, semper massa ut, rutrum mi.
        </p>
        <p>Sed sem nisi, luctus consequat ligula in, congue sodales nisl.</p>
        <p>
          Vestibulum bibendum at erat sit amet pulvinar. Pellentesque pharetra
          leo vitae tristique rutrum. Donec ut volutpat ante, ut suscipit leo.
        </p>
        <h2>Sub-header</h2>
        <p>
          Maecenas quis elementum nulla, in lacinia nisl. Ut rutrum fringilla
          aliquet. Pellentesque auctor vehicula malesuada. Aliquam id feugiat
          sem, sit amet tempor nulla. Quisque fermentum felis faucibus, vehicula
          metus ac, interdum nibh. Curabitur vitae convallis ligula. Integer ac
          enim vel felis pharetra laoreet. Interdum et malesuada fames ac ante
          ipsum primis in faucibus. Pellentesque hendrerit ac augue quis
          pretium.
        </p>
        <p>
          Morbi ut scelerisque nibh. Integer auctor, massa non dictum tristique,
          elit metus efficitur elit, ac pretium sapien nisl nec ante. In et ex
          ultricies, mollis mi in, euismod dolor.
        </p>
        <p>Quisque convallis ligula non magna efficitur tincidunt.</p>
      </article>
    </article>
  );
}
