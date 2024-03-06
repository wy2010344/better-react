import { useDom, useSvg } from "better-react-dom";
import { css } from "stylis-creater";
import { normalPanel } from "../panel/PanelContext";

/**
 * https://codepen.io/jh3y/pen/eYLaZPL
 */
export default normalPanel(function () {

  useDom("div", {
    className: cls,
    children() {
      [
        "https://assets.codepen.io/605876/tunnel-26475.mp4",
        "https://assets.codepen.io/605876/seoul-21116.mp4"
      ].forEach(function (src) {

        useDom("div", {
          className: "video-player",
          children() {
            useDom("video", {
              src,
              loop: true
            })
            useDom("div", {
              className: "instruction",
              children() {
                useSvg("svg", {
                  viewBox: "0 0 24 24",
                  children() {
                    useSvg("path", {
                      fillRule: "evenodd",
                      clipRule: "evenodd",
                      d: "M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                    })
                    useSvg("path", {
                      fillRule: "evenodd",
                      clipRule: "evenodd",
                      d: "M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                    })
                  },
                })
              },
            })
            dom.button({
              "aria-label": "play",
              children() {
                useDom("span", {
                  className: "sr-only",
                  textContent: "Play"
                })
              },
            })
          },
        })
      })
    },
  })
})

const cls = css`
&:has(.video-player:hover) {
  --active: 1;
}
.video-player:hover {
  --instruct: 1;
}
>.video-player{
  * {
    cursor: none;
  }
  position: relative;
  overflow: hidden;
  >video{
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }
  >.cursor {
    pointer-events: none;
    width: 56px;
    border-radius: 0;
    aspect-ratio: 1;
    position: fixed;
    background: hsl(10 100% 50%);
    display: grid;
    place-items: center;
    color: hsl(0 0% 100%);
    top: 0;
    left: 0;
    translate:
      calc((var(--x, 0) * 1px) - 50%)
      calc((var(--y, 0) * 1px) - 50%);
    scale: var(--active, 0);
    border-radius: 50%;
    transition: scale 0.2s;
  }

  >.instruction{
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent 0%, black);
    padding: 1rem;
    padding-top: 3rem;
    translate: 0 calc(var(--instruct, 0) * 100%);
    transition: translate 0.2s;
    >svg{
      width: 44px;
      aspect-ratio: 1;
      fill: white;
    }
  }
  >button{
    position: absolute;
    inset: 0;
    opacity: 0;
    >.sr-only{
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  }
}
`