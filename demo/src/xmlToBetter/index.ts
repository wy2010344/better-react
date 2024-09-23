import { dom } from "better-react-dom";
import { useState } from "better-react-helper";
import { getAliasOfAttribute, isSVG } from "wy-dom-helper";
import { XmlNode, parseSync } from "xml-reader";

export default function () {

  const [target, setTarget] = useState('')
  dom.button({
    style: `
    
      background: red;
    `,
    async onClick() {
      try {
        const text = await navigator.clipboard.readText()
        console.log(text)
        const targetText = parseXmlToText(text)
        setTarget(targetText)
        navigator.clipboard.writeText(targetText)
      } catch (err) {
        alert(err + "")
      }
    }
  }).renderTextContent("转化")
  dom.pre().renderTextContent(target)
  //   svgOf("svg", {
  //     width: "133",
  //     height: "43",
  //     viewBox: "0 0 133 43",
  //     fill: "none",
  //     xmlns: "http://www.w3.org/2000/svg",
  //   }).render(function () {
  //     const text = svgOf("text", {
  //       stroke: "black",
  //       alignmentBaseline: "hanging"
  //     }).render(function () {
  //       renderContent("abcd")
  //     })
  //   })
  //   useDom('pre', {
  //     textContent: target
  //   })
  //   useSvg("svg", {
  //     width: "133",
  //     height: "43",
  //     viewBox: "0 0 133 43",
  //     fill: "none",
  //     xmlns: "http://www.w3.org/2000/svg", children() {
  //       useSvg("path", {
  //         d: "M17 7H119C126.732 7 133 13.268 133 21V21C133 28.732 126.732 35 119 35H17V7Z",
  //         fill: "url(#paint0_linear_1807_8032)"
  //       })
  //       useSvg("path", {
  //         d: "M56.8688 18.48V16.4L58.9488 14.8H60.6288V26H58.7888V17.04L56.8688 18.48ZM62.65 23.44H64.49C64.5647 23.6533 64.698 23.856 64.89 24.048C65.2847 24.4427 65.818 24.64 66.49 24.64C67.0767 24.64 67.5033 24.5493 67.77 24.368C68.0367 24.1867 68.17 23.9573 68.17 23.68C68.17 23.584 68.1487 23.4987 68.106 23.424C68.0633 23.3387 67.9887 23.264 67.882 23.2C67.7753 23.136 67.674 23.0827 67.578 23.04C67.482 22.9867 67.338 22.9387 67.146 22.896C66.954 22.8427 66.7993 22.8053 66.682 22.784C66.5647 22.752 66.3833 22.7093 66.138 22.656C65.9033 22.6027 65.7273 22.5653 65.61 22.544C63.9033 22.16 63.05 21.3387 63.05 20.08C63.05 19.44 63.3433 18.88 63.93 18.4C64.5167 17.92 65.29 17.68 66.25 17.68C67.5833 17.68 68.5807 18.1067 69.242 18.96C69.5407 19.3333 69.7433 19.76 69.85 20.24H68.09C68.0047 20.0267 67.8873 19.856 67.738 19.728C67.3647 19.376 66.8687 19.2 66.25 19.2C65.77 19.2 65.4073 19.2853 65.162 19.456C64.9273 19.6267 64.81 19.84 64.81 20.096C64.81 20.192 64.8313 20.2827 64.874 20.368C64.9167 20.4427 64.9913 20.512 65.098 20.576C65.2047 20.64 65.306 20.6933 65.402 20.736C65.5087 20.7787 65.6527 20.8267 65.834 20.88C66.0153 20.9227 66.17 20.96 66.298 20.992C66.426 21.0133 66.602 21.0507 66.826 21.104C67.0607 21.1467 67.242 21.184 67.37 21.216C69.0767 21.6 69.93 22.4213 69.93 23.68C69.93 24.3627 69.6207 24.9493 69.002 25.44C68.394 25.92 67.5567 26.16 66.49 26.16C65.1033 26.16 64.042 25.7067 63.306 24.8C62.9753 24.384 62.7567 23.9307 62.65 23.44ZM71.2263 19.36V17.84H72.1863V16.08H73.8663V17.84H76.3463V19.36H73.8663V24.48H76.4263V26H72.1863V19.36H71.2263ZM83.3506 29.04V17.84H85.0306V18.88H85.1106C85.3026 18.656 85.5213 18.4587 85.7666 18.288C86.3426 17.8827 86.9773 17.68 87.6706 17.68C88.7693 17.68 89.6813 18.0747 90.4066 18.864C91.1426 19.6427 91.5106 20.6613 91.5106 21.92C91.5106 23.1787 91.1426 24.2027 90.4066 24.992C89.6813 25.7707 88.7693 26.16 87.6706 26.16C86.9666 26.16 86.332 25.9627 85.7666 25.568C85.5106 25.3867 85.292 25.184 85.1106 24.96H85.0306V29.04H83.3506ZM85.6546 19.92C85.2386 20.3893 85.0306 21.056 85.0306 21.92C85.0306 22.784 85.2386 23.456 85.6546 23.936C86.0813 24.4053 86.6466 24.64 87.3506 24.64C88.0973 24.64 88.684 24.4053 89.1106 23.936C89.5373 23.4667 89.7506 22.7947 89.7506 21.92C89.7506 21.0453 89.5373 20.3733 89.1106 19.904C88.684 19.4347 88.0973 19.2 87.3506 19.2C86.6466 19.2 86.0813 19.44 85.6546 19.92ZM93.4444 26V17.84H95.1244V19.04H95.2044C95.3217 18.816 95.4924 18.6027 95.7164 18.4C96.207 17.9733 96.783 17.76 97.4444 17.76H98.4044V19.36H97.3644C96.7137 19.36 96.175 19.568 95.7484 19.984C95.3324 20.3893 95.1244 20.928 95.1244 21.6V26H93.4444ZM100.307 16.352C100.115 16.16 100.019 15.9253 100.019 15.648C100.019 15.3707 100.115 15.136 100.307 14.944C100.499 14.7413 100.733 14.64 101.011 14.64C101.288 14.64 101.523 14.7413 101.715 14.944C101.917 15.136 102.019 15.3707 102.019 15.648C102.019 15.9253 101.917 16.16 101.715 16.352C101.523 16.544 101.288 16.64 101.011 16.64C100.733 16.64 100.499 16.544 100.307 16.352ZM100.179 26V17.84H101.859V26H100.179ZM103.633 26V24.48L108.033 19.52V19.36H103.793V17.84H110.273V19.36L105.873 24.32V24.48H110.433V26H103.633ZM112.93 24.944C112.13 24.1227 111.73 23.1147 111.73 21.92C111.73 20.7253 112.13 19.7227 112.93 18.912C113.741 18.0907 114.727 17.68 115.89 17.68C117.053 17.68 118.034 18.0907 118.834 18.912C119.645 19.7227 120.05 20.7253 120.05 21.92V22.48H113.41C113.538 23.152 113.831 23.68 114.29 24.064C114.749 24.448 115.282 24.64 115.89 24.64C116.637 24.64 117.234 24.4533 117.682 24.08C117.885 23.9307 118.061 23.744 118.21 23.52H119.97C119.746 24.0427 119.463 24.4853 119.122 24.848C118.247 25.7227 117.17 26.16 115.89 26.16C114.727 26.16 113.741 25.7547 112.93 24.944ZM113.49 21.12H118.29C118.194 20.5867 117.938 20.1333 117.522 19.76C117.117 19.3867 116.573 19.2 115.89 19.2C115.314 19.2 114.802 19.376 114.354 19.728C113.906 20.0693 113.618 20.5333 113.49 21.12Z",
  //         fill: "white"
  //       })
  //       useSvg("path", {
  //         d: "M10.4678 6.30029H16.3567V11.5349H10.4678V6.30029Z",
  //         fill: "#FDCC72"
  //       })
  //       useSvg("path", {
  //         d: "M9.81348 1.65545C9.81347 1.1286 10.4043 0.817783 10.8385 1.11626L18.5466 6.41558C19.0761 6.77961 18.8185 7.60908 18.1759 7.60908H10.4679C10.1065 7.60908 9.81354 7.31614 9.81354 6.95477L9.81348 1.65545Z",
  //         fill: "url(#paint1_linear_1807_8032)"
  //       })
  //       useSvg("path", {
  //         d: "M42.5303 6.30029H36.6414V11.5349H42.5303V6.30029Z",
  //         fill: "#FDCC72"
  //       })
  //       useSvg("path", {
  //         d: "M43.1846 1.65545C43.1846 1.1286 42.5937 0.817783 42.1596 1.11626L34.4515 6.41558C33.9219 6.77961 34.1796 7.60908 34.8221 7.60908H42.5302C42.8916 7.60908 43.1845 7.31614 43.1845 6.95477L43.1846 1.65545Z",
  //         fill: "url(#paint2_linear_1807_8032)"
  //       })
  //       useSvg("mask", {
  //         id: "mask0_1807_8032",
  //         style: "mask-type:alpha",
  //         maskUnits: "userSpaceOnUse",
  //         x: "0",
  //         y: "10",
  //         width: "53",
  //         height: "8", children() {
  //           useSvg("path", {
  //             d: "M0 10.8809C0 10.5195 0.29295 10.2266 0.654321 10.2266H52.3457C52.7071 10.2266 53 10.5195 53 10.8809V16.7698C53 17.1311 52.7071 17.4241 52.3457 17.4241H0.654321C0.292949 17.4241 0 17.1311 0 16.7698V10.8809Z",
  //             fill: "url(#paint3_linear_1807_8032)"
  //           })
  //         }
  //       })
  //       useSvg("g", {
  //         mask: "url(#mask0_1807_8032)", children() {
  //           useSvg("path", {
  //             d: "M0.24976 11.0675C0.124948 10.648 0.439229 10.2266 0.876912 10.2266H52.1222C52.5599 10.2266 52.8742 10.648 52.7494 11.0675L46.7145 31.3514C46.6319 31.6289 46.3768 31.8192 46.0873 31.8192H6.91181C6.6223 31.8192 6.36721 31.6289 6.28466 31.3514L0.24976 11.0675Z",
  //             fill: "url(#paint4_linear_1807_8032)"
  //           })
  //         }
  //       })
  //       useSvg("mask", {
  //         id: "mask1_1807_8032",
  //         style: "mask-type:alpha",
  //         maskUnits: "userSpaceOnUse",
  //         x: "0",
  //         y: "17",
  //         width: "53",
  //         height: "8", children() {
  //           useSvg("path", {
  //             d: "M0.654297 17.4238H52.3457V24.6214H0.654297V17.4238Z",
  //             fill: "url(#paint5_linear_1807_8032)"
  //           })
  //         }
  //       })
  //       useSvg("g", {
  //         mask: "url(#mask1_1807_8032)", children() {
  //           useSvg("path", {
  //             d: "M0.654297 10.2266H52.3457L46.08 31.8192H6.91992L0.654297 10.2266Z",
  //             fill: "url(#paint6_linear_1807_8032)"
  //           })
  //         }
  //       })
  //       useSvg("mask", {
  //         id: "mask2_1807_8032",
  //         style: "mask-type:alpha",
  //         maskUnits: "userSpaceOnUse",
  //         x: "1",
  //         y: "24",
  //         width: "51",
  //         height: "8", children() {
  //           useSvg("path", {
  //             d: "M1.30859 25.2759C1.30859 24.9145 1.60154 24.6216 1.96291 24.6216H51.037C51.3984 24.6216 51.6913 24.9145 51.6913 25.2759V31.1648C51.6913 31.5262 51.3984 31.8191 51.037 31.8191H1.96291C1.60154 31.8191 1.30859 31.5262 1.30859 31.1648V25.2759Z",
  //             fill: "url(#paint7_linear_1807_8032)"
  //           })
  //         }
  //       })
  //       useSvg("g", {
  //         mask: "url(#mask2_1807_8032)", children() {
  //           useSvg("path", {
  //             d: "M1.54413 11.059C1.42602 10.6414 1.73977 10.2266 2.17376 10.2266H50.8264C51.2604 10.2266 51.5741 10.6413 51.456 11.059L45.7191 31.3429C45.6394 31.6246 45.3823 31.8192 45.0895 31.8192H7.91063C7.61784 31.8192 7.36069 31.6246 7.28101 31.3429L1.54413 11.059Z",
  //             fill: "url(#paint8_linear_1807_8032)"
  //           })
  //         }
  //       })
  //       useSvg("g", {
  //         filter: "url(#filter0_d_1807_8032)", children() {
  //           useSvg("path", {
  //             d: "M25.1912 1.82086C26.001 1.35333 26.9987 1.35333 27.8085 1.82086L42.4743 10.2882C43.2841 10.7557 43.783 11.6197 43.783 12.5548V29.4894C43.783 30.4245 43.2841 31.2885 42.4743 31.756L27.8085 40.2233C26.9987 40.6909 26.001 40.6909 25.1912 40.2233L10.5254 31.756C9.71565 31.2885 9.2168 30.4245 9.2168 29.4894V12.5548C9.2168 11.6197 9.71565 10.7557 10.5254 10.2882L25.1912 1.82086Z",
  //             fill: "url(#paint9_radial_1807_8032)"
  //           })
  //         }
  //       })
  //       useSvg("path", {
  //         d: "M25.8455 5.36917C26.2504 5.13541 26.7493 5.13541 27.1542 5.36917L39.7286 12.6291C40.1335 12.8628 40.383 13.2948 40.383 13.7624V28.2822C40.383 28.7497 40.1335 29.1817 39.7286 29.4155L27.1542 36.6754C26.7493 36.9091 26.2504 36.9091 25.8455 36.6754L13.271 29.4155C12.8661 29.1817 12.6167 28.7497 12.6167 28.2822V13.7624C12.6167 13.2948 12.8661 12.8628 13.271 12.6291L25.8455 5.36917Z",
  //         fill: "url(#paint10_linear_1807_8032)"
  //       })
  //       useSvg("path", {
  //         fillRule: "evenodd",
  //         clipRule: "evenodd",
  //         d: "M25.5189 4.80205C26.1262 4.4514 26.8745 4.4514 27.4818 4.80205L40.0563 12.0619C40.6637 12.4126 41.0378 13.0606 41.0378 13.7619V28.2817C41.0378 28.983 40.6637 29.631 40.0563 29.9817L27.4818 37.2415C26.8745 37.5922 26.1262 37.5922 25.5189 37.2415L12.9444 29.9817C12.337 29.631 11.9629 28.983 11.9629 28.2817V13.7619C11.9629 13.0606 12.337 12.4126 12.9444 12.0619L25.5189 4.80205ZM26.8275 5.93537C26.6251 5.81848 26.3756 5.81848 26.1732 5.93537L13.5987 13.1953C13.3962 13.3121 13.2715 13.5281 13.2715 13.7619V28.2817C13.2715 28.5155 13.3962 28.7315 13.5987 28.8483L26.1732 36.1082C26.3756 36.2251 26.6251 36.2251 26.8275 36.1082L39.402 28.8483C39.6044 28.7315 39.7292 28.5155 39.7292 28.2817V13.7619C39.7292 13.5281 39.6044 13.3121 39.402 13.1953L26.8275 5.93537Z",
  //         fill: "url(#paint11_linear_1807_8032)"
  //       })
  //       useSvg("g", {
  //         filter: "url(#filter1_d_1807_8032)", children() {
  //           useSvg("path", {
  //             d: "M23.9609 27.8926L25.6475 17.8161L22.9019 19.564L23.5687 15.554L26.7654 13.4976H30.0994L27.6871 27.8926H23.9609Z",
  //             fill: "#FFF5CA"
  //           })
  //         }
  //       })
  //       useSvg("defs", {
  //         children() {
  //           useSvg("filter", {
  //             id: "filter0_d_1807_8032",
  //             x: "7.89409",
  //             y: "0.80886",
  //             width: "37.2118",
  //             height: "41.7494",
  //             filterUnits: "userSpaceOnUse",
  //             colorInterpolationFilters: "sRGB", children() {
  //               useSvg("feFlood", {
  //                 floodOpacity: "0",
  //                 result: "BackgroundImageFix"
  //               })
  //               useSvg("feColorMatrix", {
  //                 in: "SourceAlpha",
  //                 type: "matrix",
  //                 values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0",
  //                 result: "hardAlpha"
  //               })
  //               useSvg("feOffset", {
  //                 dy: "0.661355"
  //               })
  //               useSvg("feGaussianBlur", {
  //                 stdDeviation: "0.661355"
  //               })
  //               useSvg("feComposite", {
  //                 in2: "hardAlpha",
  //                 operator: "out"
  //               })
  //               useSvg("feColorMatrix", {
  //                 type: "matrix",
  //                 values: "0 0 0 0 0.645833 0 0 0 0 0.365972 0 0 0 0 0.107639 0 0 0 0.25 0"
  //               })
  //               useSvg("feBlend", {
  //                 mode: "normal",
  //                 in2: "BackgroundImageFix",
  //                 result: "effect1_dropShadow_1807_8032"
  //               })
  //               useSvg("feBlend", {
  //                 mode: "normal",
  //                 in: "SourceGraphic",
  //                 in2: "effect1_dropShadow_1807_8032",
  //                 result: "shape"
  //               })
  //             }
  //           })
  //           useSvg("filter", {
  //             id: "filter1_d_1807_8032",
  //             x: "20.9178",
  //             y: "12.1748",
  //             width: "11.1659",
  //             height: "18.3632",
  //             filterUnits: "userSpaceOnUse",
  //             colorInterpolationFilters: "sRGB", children() {
  //               useSvg("feFlood", {
  //                 floodOpacity: "0",
  //                 result: "BackgroundImageFix"
  //               })
  //               useSvg("feColorMatrix", {
  //                 in: "SourceAlpha",
  //                 type: "matrix",
  //                 values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0",
  //                 result: "hardAlpha"
  //               })
  //               useSvg("feOffset", {
  //                 dy: "0.661355"
  //               })
  //               useSvg("feGaussianBlur", {
  //                 stdDeviation: "0.992033"
  //               })
  //               useSvg("feComposite", {
  //                 in2: "hardAlpha",
  //                 operator: "out"
  //               })
  //               useSvg("feColorMatrix", {
  //                 type: "matrix",
  //                 values: "0 0 0 0 0.754167 0 0 0 0 0.2715 0 0 0 0 0 0 0 0 0.25 0"
  //               })
  //               useSvg("feBlend", {
  //                 mode: "normal",
  //                 in2: "BackgroundImageFix",
  //                 result: "effect1_dropShadow_1807_8032"
  //               })
  //               useSvg("feBlend", {
  //                 mode: "normal",
  //                 in: "SourceGraphic",
  //                 in2: "effect1_dropShadow_1807_8032",
  //                 result: "shape"
  //               })
  //             }
  //           })
  //           useSvg("linearGradient", {
  //             id: "paint0_linear_1807_8032",
  //             x1: "68.7857",
  //             y1: "-2.54545",
  //             x2: "79.7111",
  //             y2: "51.6002",
  //             gradientUnits: "userSpaceOnUse", children() {
  //               useSvg("stop", {
  //                 stopColor: "#FFA74C"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#FF8122"
  //               })
  //             }
  //           })
  //           useSvg("linearGradient", {
  //             id: "paint1_linear_1807_8032",
  //             x1: "10.4678",
  //             y1: "1.39303",
  //             x2: "15.048",
  //             y2: "7.60908",
  //             gradientUnits: "userSpaceOnUse", children() {
  //               useSvg("stop", {
  //                 stopColor: "#FBCC75"
  //               })
  //               useSvg("stop", {
  //                 offset: "0.404271",
  //                 stopColor: "#FFCB6A"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#FBB605"
  //               })
  //             }
  //           })
  //           useSvg("linearGradient", {
  //             id: "paint2_linear_1807_8032",
  //             x1: "42.5303",
  //             y1: "1.06587",
  //             x2: "37.95",
  //             y2: "8.59057",
  //             gradientUnits: "userSpaceOnUse", children() {
  //               useSvg("stop", {
  //                 stopColor: "#FBCC75"
  //               })
  //               useSvg("stop", {
  //                 offset: "0.404271",
  //                 stopColor: "#FFCB6A"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#FBB605"
  //               })
  //             }
  //           })
  //           useSvg("linearGradient", {
  //             id: "paint3_linear_1807_8032",
  //             x1: "26.5",
  //             y1: "10.2266",
  //             x2: "26.5",
  //             y2: "17.0969",
  //             gradientUnits: "userSpaceOnUse", children() {
  //               useSvg("stop", {
  //                 stopColor: "#FBCF75"
  //               })
  //               useSvg("stop", {
  //                 offset: "0.635417",
  //                 stopColor: "#FFC246"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#FFB800"
  //               })
  //             }
  //           })
  //           useSvg("linearGradient", {
  //             id: "paint4_linear_1807_8032",
  //             x1: "26.4996",
  //             y1: "10.2266",
  //             x2: "26.4996",
  //             y2: "19.3871",
  //             gradientUnits: "userSpaceOnUse", children() {
  //               useSvg("stop", {
  //                 stopColor: "#FBCC75"
  //               })
  //               useSvg("stop", {
  //                 offset: "0.404271",
  //                 stopColor: "#FFCB6A"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#FBB605"
  //               })
  //             }
  //           })
  //           useSvg("linearGradient", {
  //             id: "paint5_linear_1807_8032",
  //             x1: "26.5",
  //             y1: "17.4238",
  //             x2: "26.5",
  //             y2: "23.6399",
  //             gradientUnits: "userSpaceOnUse", children() {
  //               useSvg("stop", {
  //                 stopColor: "#FFEECE"
  //               })
  //               useSvg("stop", {
  //                 offset: "0.473958",
  //                 stopColor: "#FFCB6A"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#F7B100"
  //               })
  //             }
  //           })
  //           useSvg("linearGradient", {
  //             id: "paint6_linear_1807_8032",
  //             x1: "26.5",
  //             y1: "10.2266",
  //             x2: "26.5",
  //             y2: "28.8747",
  //             gradientUnits: "userSpaceOnUse", children() {
  //               useSvg("stop", {
  //                 stopColor: "#FFEECE"
  //               })
  //               useSvg("stop", {
  //                 offset: "0.473958",
  //                 stopColor: "#FFCB6A"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#F7B100"
  //               })
  //             }
  //           })
  //           useSvg("linearGradient", {
  //             id: "paint7_linear_1807_8032",
  //             x1: "26.5",
  //             y1: "25.2759",
  //             x2: "26.5",
  //             y2: "34.4364",
  //             gradientUnits: "userSpaceOnUse", children() {
  //               useSvg("stop", {
  //                 stopColor: "#FFE3B0"
  //               })
  //               useSvg("stop", {
  //                 offset: "0.404271",
  //                 stopColor: "#FFCB6A"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#FBB605"
  //               })
  //             }
  //           })
  //           useSvg("linearGradient", {
  //             id: "paint8_linear_1807_8032",
  //             x1: "26.5001",
  //             y1: "12.1895",
  //             x2: "26.5001",
  //             y2: "39.671",
  //             gradientUnits: "userSpaceOnUse", children() {
  //               useSvg("stop", {
  //                 stopColor: "#FFE3B0"
  //               })
  //               useSvg("stop", {
  //                 offset: "0.404271",
  //                 stopColor: "#FFCB6A"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#FBB605"
  //               })
  //             }
  //           })
  //           useSvg("radialGradient", {
  //             id: "paint9_radial_1807_8032",
  //             cx: "0",
  //             cy: "0",
  //             r: "1",
  //             gradientUnits: "userSpaceOnUse",
  //             gradientTransform: "translate(26.4999 21.0221) rotate(90) scale(19.9568 19.9568)", children() {
  //               useSvg("stop", {
  //                 stopColor: "#FFDC99"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#FFE099"
  //               })
  //             }
  //           })
  //           useSvg("linearGradient", {
  //             id: "paint10_linear_1807_8032",
  //             x1: "21.7849",
  //             y1: "4.9914",
  //             x2: "30.5861",
  //             y2: "37.0531",
  //             gradientUnits: "userSpaceOnUse", children() {
  //               useSvg("stop", {
  //                 stopColor: "#FFC46C"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#FF6D0C"
  //               })
  //             }
  //           })
  //           useSvg("linearGradient", {
  //             id: "paint11_linear_1807_8032",
  //             x1: "9.81516",
  //             y1: "3.02797",
  //             x2: "45.1485",
  //             y2: "40.3243",
  //             gradientUnits: "userSpaceOnUse", children() {
  //               useSvg("stop", {
  //                 stopColor: "#A50E00"
  //               })
  //               useSvg("stop", {
  //                 offset: "1",
  //                 stopColor: "#FF5C00",
  //                 stopOpacity: "0.43"
  //               })
  //             }
  //           })
  //         }
  //       })
  //     }
  //   })
  //   useDom("div", {
  //     innerHTML: `
  //      <svg width="133" height="43" viewBox="0 0 133 43" fill="none" xmlns="http://www.w3.org/2000/svg">
  //   <path d="M17 7H119C126.732 7 133 13.268 133 21V21C133 28.732 126.732 35 119 35H17V7Z"
  //     fill="url(#paint0_linear_1807_8032)" />
  //   <path
  //     d="M56.8688 18.48V16.4L58.9488 14.8H60.6288V26H58.7888V17.04L56.8688 18.48ZM62.65 23.44H64.49C64.5647 23.6533 64.698 23.856 64.89 24.048C65.2847 24.4427 65.818 24.64 66.49 24.64C67.0767 24.64 67.5033 24.5493 67.77 24.368C68.0367 24.1867 68.17 23.9573 68.17 23.68C68.17 23.584 68.1487 23.4987 68.106 23.424C68.0633 23.3387 67.9887 23.264 67.882 23.2C67.7753 23.136 67.674 23.0827 67.578 23.04C67.482 22.9867 67.338 22.9387 67.146 22.896C66.954 22.8427 66.7993 22.8053 66.682 22.784C66.5647 22.752 66.3833 22.7093 66.138 22.656C65.9033 22.6027 65.7273 22.5653 65.61 22.544C63.9033 22.16 63.05 21.3387 63.05 20.08C63.05 19.44 63.3433 18.88 63.93 18.4C64.5167 17.92 65.29 17.68 66.25 17.68C67.5833 17.68 68.5807 18.1067 69.242 18.96C69.5407 19.3333 69.7433 19.76 69.85 20.24H68.09C68.0047 20.0267 67.8873 19.856 67.738 19.728C67.3647 19.376 66.8687 19.2 66.25 19.2C65.77 19.2 65.4073 19.2853 65.162 19.456C64.9273 19.6267 64.81 19.84 64.81 20.096C64.81 20.192 64.8313 20.2827 64.874 20.368C64.9167 20.4427 64.9913 20.512 65.098 20.576C65.2047 20.64 65.306 20.6933 65.402 20.736C65.5087 20.7787 65.6527 20.8267 65.834 20.88C66.0153 20.9227 66.17 20.96 66.298 20.992C66.426 21.0133 66.602 21.0507 66.826 21.104C67.0607 21.1467 67.242 21.184 67.37 21.216C69.0767 21.6 69.93 22.4213 69.93 23.68C69.93 24.3627 69.6207 24.9493 69.002 25.44C68.394 25.92 67.5567 26.16 66.49 26.16C65.1033 26.16 64.042 25.7067 63.306 24.8C62.9753 24.384 62.7567 23.9307 62.65 23.44ZM71.2263 19.36V17.84H72.1863V16.08H73.8663V17.84H76.3463V19.36H73.8663V24.48H76.4263V26H72.1863V19.36H71.2263ZM83.3506 29.04V17.84H85.0306V18.88H85.1106C85.3026 18.656 85.5213 18.4587 85.7666 18.288C86.3426 17.8827 86.9773 17.68 87.6706 17.68C88.7693 17.68 89.6813 18.0747 90.4066 18.864C91.1426 19.6427 91.5106 20.6613 91.5106 21.92C91.5106 23.1787 91.1426 24.2027 90.4066 24.992C89.6813 25.7707 88.7693 26.16 87.6706 26.16C86.9666 26.16 86.332 25.9627 85.7666 25.568C85.5106 25.3867 85.292 25.184 85.1106 24.96H85.0306V29.04H83.3506ZM85.6546 19.92C85.2386 20.3893 85.0306 21.056 85.0306 21.92C85.0306 22.784 85.2386 23.456 85.6546 23.936C86.0813 24.4053 86.6466 24.64 87.3506 24.64C88.0973 24.64 88.684 24.4053 89.1106 23.936C89.5373 23.4667 89.7506 22.7947 89.7506 21.92C89.7506 21.0453 89.5373 20.3733 89.1106 19.904C88.684 19.4347 88.0973 19.2 87.3506 19.2C86.6466 19.2 86.0813 19.44 85.6546 19.92ZM93.4444 26V17.84H95.1244V19.04H95.2044C95.3217 18.816 95.4924 18.6027 95.7164 18.4C96.207 17.9733 96.783 17.76 97.4444 17.76H98.4044V19.36H97.3644C96.7137 19.36 96.175 19.568 95.7484 19.984C95.3324 20.3893 95.1244 20.928 95.1244 21.6V26H93.4444ZM100.307 16.352C100.115 16.16 100.019 15.9253 100.019 15.648C100.019 15.3707 100.115 15.136 100.307 14.944C100.499 14.7413 100.733 14.64 101.011 14.64C101.288 14.64 101.523 14.7413 101.715 14.944C101.917 15.136 102.019 15.3707 102.019 15.648C102.019 15.9253 101.917 16.16 101.715 16.352C101.523 16.544 101.288 16.64 101.011 16.64C100.733 16.64 100.499 16.544 100.307 16.352ZM100.179 26V17.84H101.859V26H100.179ZM103.633 26V24.48L108.033 19.52V19.36H103.793V17.84H110.273V19.36L105.873 24.32V24.48H110.433V26H103.633ZM112.93 24.944C112.13 24.1227 111.73 23.1147 111.73 21.92C111.73 20.7253 112.13 19.7227 112.93 18.912C113.741 18.0907 114.727 17.68 115.89 17.68C117.053 17.68 118.034 18.0907 118.834 18.912C119.645 19.7227 120.05 20.7253 120.05 21.92V22.48H113.41C113.538 23.152 113.831 23.68 114.29 24.064C114.749 24.448 115.282 24.64 115.89 24.64C116.637 24.64 117.234 24.4533 117.682 24.08C117.885 23.9307 118.061 23.744 118.21 23.52H119.97C119.746 24.0427 119.463 24.4853 119.122 24.848C118.247 25.7227 117.17 26.16 115.89 26.16C114.727 26.16 113.741 25.7547 112.93 24.944ZM113.49 21.12H118.29C118.194 20.5867 117.938 20.1333 117.522 19.76C117.117 19.3867 116.573 19.2 115.89 19.2C115.314 19.2 114.802 19.376 114.354 19.728C113.906 20.0693 113.618 20.5333 113.49 21.12Z"
  //     fill="white" />
  //   <path d="M10.4678 6.30029H16.3567V11.5349H10.4678V6.30029Z" fill="#FDCC72" />
  //   <path
  //     d="M9.81348 1.65545C9.81347 1.1286 10.4043 0.817783 10.8385 1.11626L18.5466 6.41558C19.0761 6.77961 18.8185 7.60908 18.1759 7.60908H10.4679C10.1065 7.60908 9.81354 7.31614 9.81354 6.95477L9.81348 1.65545Z"
  //     fill="url(#paint1_linear_1807_8032)" />
  //   <path d="M42.5303 6.30029H36.6414V11.5349H42.5303V6.30029Z" fill="#FDCC72" />
  //   <path
  //     d="M43.1846 1.65545C43.1846 1.1286 42.5937 0.817783 42.1596 1.11626L34.4515 6.41558C33.9219 6.77961 34.1796 7.60908 34.8221 7.60908H42.5302C42.8916 7.60908 43.1845 7.31614 43.1845 6.95477L43.1846 1.65545Z"
  //     fill="url(#paint2_linear_1807_8032)" />
  //   <mask id="mask0_1807_8032" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="10" width="53" height="8">
  //     <path
  //       d="M0 10.8809C0 10.5195 0.29295 10.2266 0.654321 10.2266H52.3457C52.7071 10.2266 53 10.5195 53 10.8809V16.7698C53 17.1311 52.7071 17.4241 52.3457 17.4241H0.654321C0.292949 17.4241 0 17.1311 0 16.7698V10.8809Z"
  //       fill="url(#paint3_linear_1807_8032)" />
  //   </mask>
  //   <g mask="url(#mask0_1807_8032)">
  //     <path
  //       d="M0.24976 11.0675C0.124948 10.648 0.439229 10.2266 0.876912 10.2266H52.1222C52.5599 10.2266 52.8742 10.648 52.7494 11.0675L46.7145 31.3514C46.6319 31.6289 46.3768 31.8192 46.0873 31.8192H6.91181C6.6223 31.8192 6.36721 31.6289 6.28466 31.3514L0.24976 11.0675Z"
  //       fill="url(#paint4_linear_1807_8032)" />
  //   </g>
  //   <mask id="mask1_1807_8032" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="17" width="53" height="8">
  //     <path d="M0.654297 17.4238H52.3457V24.6214H0.654297V17.4238Z" fill="url(#paint5_linear_1807_8032)" />
  //   </mask>
  //   <g mask="url(#mask1_1807_8032)">
  //     <path d="M0.654297 10.2266H52.3457L46.08 31.8192H6.91992L0.654297 10.2266Z" fill="url(#paint6_linear_1807_8032)" />
  //   </g>
  //   <mask id="mask2_1807_8032" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="1" y="24" width="51" height="8">
  //     <path
  //       d="M1.30859 25.2759C1.30859 24.9145 1.60154 24.6216 1.96291 24.6216H51.037C51.3984 24.6216 51.6913 24.9145 51.6913 25.2759V31.1648C51.6913 31.5262 51.3984 31.8191 51.037 31.8191H1.96291C1.60154 31.8191 1.30859 31.5262 1.30859 31.1648V25.2759Z"
  //       fill="url(#paint7_linear_1807_8032)" />
  //   </mask>
  //   <g mask="url(#mask2_1807_8032)">
  //     <path
  //       d="M1.54413 11.059C1.42602 10.6414 1.73977 10.2266 2.17376 10.2266H50.8264C51.2604 10.2266 51.5741 10.6413 51.456 11.059L45.7191 31.3429C45.6394 31.6246 45.3823 31.8192 45.0895 31.8192H7.91063C7.61784 31.8192 7.36069 31.6246 7.28101 31.3429L1.54413 11.059Z"
  //       fill="url(#paint8_linear_1807_8032)" />
  //   </g>
  //   <g filter="url(#filter0_d_1807_8032)">
  //     <path
  //       d="M25.1912 1.82086C26.001 1.35333 26.9987 1.35333 27.8085 1.82086L42.4743 10.2882C43.2841 10.7557 43.783 11.6197 43.783 12.5548V29.4894C43.783 30.4245 43.2841 31.2885 42.4743 31.756L27.8085 40.2233C26.9987 40.6909 26.001 40.6909 25.1912 40.2233L10.5254 31.756C9.71565 31.2885 9.2168 30.4245 9.2168 29.4894V12.5548C9.2168 11.6197 9.71565 10.7557 10.5254 10.2882L25.1912 1.82086Z"
  //       fill="url(#paint9_radial_1807_8032)" />
  //   </g>
  //   <path
  //     d="M25.8455 5.36917C26.2504 5.13541 26.7493 5.13541 27.1542 5.36917L39.7286 12.6291C40.1335 12.8628 40.383 13.2948 40.383 13.7624V28.2822C40.383 28.7497 40.1335 29.1817 39.7286 29.4155L27.1542 36.6754C26.7493 36.9091 26.2504 36.9091 25.8455 36.6754L13.271 29.4155C12.8661 29.1817 12.6167 28.7497 12.6167 28.2822V13.7624C12.6167 13.2948 12.8661 12.8628 13.271 12.6291L25.8455 5.36917Z"
  //     fill="url(#paint10_linear_1807_8032)" />
  //   <path fill-rule="evenodd" clip-rule="evenodd"
  //     d="M25.5189 4.80205C26.1262 4.4514 26.8745 4.4514 27.4818 4.80205L40.0563 12.0619C40.6637 12.4126 41.0378 13.0606 41.0378 13.7619V28.2817C41.0378 28.983 40.6637 29.631 40.0563 29.9817L27.4818 37.2415C26.8745 37.5922 26.1262 37.5922 25.5189 37.2415L12.9444 29.9817C12.337 29.631 11.9629 28.983 11.9629 28.2817V13.7619C11.9629 13.0606 12.337 12.4126 12.9444 12.0619L25.5189 4.80205ZM26.8275 5.93537C26.6251 5.81848 26.3756 5.81848 26.1732 5.93537L13.5987 13.1953C13.3962 13.3121 13.2715 13.5281 13.2715 13.7619V28.2817C13.2715 28.5155 13.3962 28.7315 13.5987 28.8483L26.1732 36.1082C26.3756 36.2251 26.6251 36.2251 26.8275 36.1082L39.402 28.8483C39.6044 28.7315 39.7292 28.5155 39.7292 28.2817V13.7619C39.7292 13.5281 39.6044 13.3121 39.402 13.1953L26.8275 5.93537Z"
  //     fill="url(#paint11_linear_1807_8032)" />
  //   <g filter="url(#filter1_d_1807_8032)">
  //     <path
  //       d="M23.9609 27.8926L25.6475 17.8161L22.9019 19.564L23.5687 15.554L26.7654 13.4976H30.0994L27.6871 27.8926H23.9609Z"
  //       fill="#FFF5CA" />
  //   </g>
  //   <defs>
  //     <filter id="filter0_d_1807_8032" x="7.89409" y="0.80886" width="37.2118" height="41.7494"
  //       filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
  //       <feFlood flood-opacity="0" result="BackgroundImageFix" />
  //       <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
  //         result="hardAlpha" />
  //       <feOffset dy="0.661355" />
  //       <feGaussianBlur stdDeviation="0.661355" />
  //       <feComposite in2="hardAlpha" operator="out" />
  //       <feColorMatrix type="matrix" values="0 0 0 0 0.645833 0 0 0 0 0.365972 0 0 0 0 0.107639 0 0 0 0.25 0" />
  //       <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1807_8032" />
  //       <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1807_8032" result="shape" />
  //     </filter>
  //     <filter id="filter1_d_1807_8032" x="20.9178" y="12.1748" width="11.1659" height="18.3632"
  //       filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
  //       <feFlood flood-opacity="0" result="BackgroundImageFix" />
  //       <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
  //         result="hardAlpha" />
  //       <feOffset dy="0.661355" />
  //       <feGaussianBlur stdDeviation="0.992033" />
  //       <feComposite in2="hardAlpha" operator="out" />
  //       <feColorMatrix type="matrix" values="0 0 0 0 0.754167 0 0 0 0 0.2715 0 0 0 0 0 0 0 0 0.25 0" />
  //       <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1807_8032" />
  //       <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1807_8032" result="shape" />
  //     </filter>
  //     <linearGradient id="paint0_linear_1807_8032" x1="68.7857" y1="-2.54545" x2="79.7111" y2="51.6002"
  //       gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#FFA74C" />
  //       <stop offset="1" stop-color="#FF8122" />
  //     </linearGradient>
  //     <linearGradient id="paint1_linear_1807_8032" x1="10.4678" y1="1.39303" x2="15.048" y2="7.60908"
  //       gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#FBCC75" />
  //       <stop offset="0.404271" stop-color="#FFCB6A" />
  //       <stop offset="1" stop-color="#FBB605" />
  //     </linearGradient>
  //     <linearGradient id="paint2_linear_1807_8032" x1="42.5303" y1="1.06587" x2="37.95" y2="8.59057"
  //       gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#FBCC75" />
  //       <stop offset="0.404271" stop-color="#FFCB6A" />
  //       <stop offset="1" stop-color="#FBB605" />
  //     </linearGradient>
  //     <linearGradient id="paint3_linear_1807_8032" x1="26.5" y1="10.2266" x2="26.5" y2="17.0969"
  //       gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#FBCF75" />
  //       <stop offset="0.635417" stop-color="#FFC246" />
  //       <stop offset="1" stop-color="#FFB800" />
  //     </linearGradient>
  //     <linearGradient id="paint4_linear_1807_8032" x1="26.4996" y1="10.2266" x2="26.4996" y2="19.3871"
  //       gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#FBCC75" />
  //       <stop offset="0.404271" stop-color="#FFCB6A" />
  //       <stop offset="1" stop-color="#FBB605" />
  //     </linearGradient>
  //     <linearGradient id="paint5_linear_1807_8032" x1="26.5" y1="17.4238" x2="26.5" y2="23.6399"
  //       gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#FFEECE" />
  //       <stop offset="0.473958" stop-color="#FFCB6A" />
  //       <stop offset="1" stop-color="#F7B100" />
  //     </linearGradient>
  //     <linearGradient id="paint6_linear_1807_8032" x1="26.5" y1="10.2266" x2="26.5" y2="28.8747"
  //       gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#FFEECE" />
  //       <stop offset="0.473958" stop-color="#FFCB6A" />
  //       <stop offset="1" stop-color="#F7B100" />
  //     </linearGradient>
  //     <linearGradient id="paint7_linear_1807_8032" x1="26.5" y1="25.2759" x2="26.5" y2="34.4364"
  //       gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#FFE3B0" />
  //       <stop offset="0.404271" stop-color="#FFCB6A" />
  //       <stop offset="1" stop-color="#FBB605" />
  //     </linearGradient>
  //     <linearGradient id="paint8_linear_1807_8032" x1="26.5001" y1="12.1895" x2="26.5001" y2="39.671"
  //       gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#FFE3B0" />
  //       <stop offset="0.404271" stop-color="#FFCB6A" />
  //       <stop offset="1" stop-color="#FBB605" />
  //     </linearGradient>
  //     <radialGradient id="paint9_radial_1807_8032" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
  //       gradientTransform="translate(26.4999 21.0221) rotate(90) scale(19.9568 19.9568)">
  //       <stop stop-color="#FFDC99" />
  //       <stop offset="1" stop-color="#FFE099" />
  //     </radialGradient>
  //     <linearGradient id="paint10_linear_1807_8032" x1="21.7849" y1="4.9914" x2="30.5861" y2="37.0531"
  //       gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#FFC46C" />
  //       <stop offset="1" stop-color="#FF6D0C" />
  //     </linearGradient>
  //     <linearGradient id="paint11_linear_1807_8032" x1="9.81516" y1="3.02797" x2="45.1485" y2="40.3243"
  //       gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#A50E00" />
  //       <stop offset="1" stop-color="#FF5C00" stop-opacity="0.43" />
  //     </linearGradient>
  //   </defs>
  // </svg>
  //       `
  //   })
  // useDom("div", {
  //   innerHTML: `
  //   <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.052 3.599c.16.384.464.69.848.849l1.346.557a1.568 1.568 0 01.849 2.05L16.538 8.4c-.16.384-.16.816 0 1.2l.556 1.345a1.567 1.567 0 01-.849 2.05l-1.345.557c-.384.159-.69.464-.849.848l-.557 1.346a1.568 1.568 0 01-2.05.849l-1.344-.557a1.568 1.568 0 00-1.2 0l-1.346.557a1.568 1.568 0 01-2.048-.848L4.948 14.4a1.568 1.568 0 00-.847-.849l-1.347-.557a1.568 1.568 0 01-.849-2.048L2.463 9.6a1.568 1.568 0 00-.001-1.2l-.557-1.348a1.568 1.568 0 01.85-2.049l1.344-.557c.384-.159.69-.464.849-.847l.558-1.346a1.568 1.568 0 012.048-.849l1.346.557c.384.159.815.159 1.2 0l1.346-.556a1.568 1.568 0 012.049.848l.557 1.347V3.6z" fill="url(#paint0_linear_1720_8057)" stroke="#FFFBDB" stroke-linecap="round" stroke-linejoin="round"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M13.12 6.659c.228.224.23.59.007.818l-3.794 3.857a.579.579 0 01-.83-.005L6.51 9.252a.579.579 0 11.835-.801l1.58 1.647 3.376-3.432a.579.579 0 01.818-.007z" fill="#FFFBDB"></path><defs><linearGradient id="paint0_linear_1720_8057" x1="2.41632" y1="4.59903" x2="16.6882" y2="12.2023" gradientUnits="userSpaceOnUse"><stop stop-color="#FF9F00"></stop><stop offset="0.307292" stop-color="#FFB947"></stop><stop offset="1" stop-color="#FF8B02"></stop></linearGradient></defs></svg>
  //   `
  // })
}

export function parseXmlToText(text: string) {
  const data = parseSync(text)
  console.log(data)

  return toBetter(data)
}
function toBetter(data: XmlNode): string {
  if (data.type == "element") {
    const name = data.name
    let attrs = getAttributes(data.attributes)

    let renderExt = 'render()'
    if (data.children.length) {
      if (name.toLowerCase() == "text") {
        renderExt = `renderTextContent(${JSON.stringify(data.children.map(child => {
          if (child.type == "element") {
            console.log('text下面不支持其它元素')
            return ''
          }
          return child.value
        }).join(''))})`
      } else {
        const dataChild = data.children[0]
        if (data.children.length == 1 && dataChild.type == "text") {
          //只有一个text的子节点
          renderExt = `renderTextContent(${JSON.stringify(dataChild.value)})`
        } else {
          renderExt = `render(()=>{
            ${data.children.map(child => {
            return toBetter(child)
          }).join('\n')}
          })`
        }
      }
    }
    if (attrs) {
      attrs = `{
        ${attrs}
      }`
    }
    const fun = isSVG(name) ? `svg.${name.toLowerCase()}` : `dom.${name.toLowerCase()}`
    return `${fun}(${attrs}).${renderExt}`
  } else {
    console.log('warn,暂不支持纯文字')
    return `renderContent(${JSON.stringify(data.value)})`
  }
}

function getAttributes(attributes: { [key: string]: string }) {
  return Object.entries(attributes).map(function ([key, value]) {
    let transKey = key
    if (transKey == "class") {
      transKey = "className"
    }
    transKey = getAliasOfAttribute(transKey)
    if (transKey.includes('-')) {
      transKey = `"${transKey}"`
    }
    return `${transKey}:${JSON.stringify(value)}`
  }).join(',\n')
}

// 减号转换驼峰
function centerLine2Hump(name: string) {
  return name.replace(/-(\w)/g, function (all, letter) {
    return letter.toUpperCase();
  });
}
// 下划线转换驼峰
function line2Hump(name: string) {
  return name.replace(/_(\w)/g, function (all, letter) {
    return letter.toUpperCase();
  });
}
// 驼峰转换下划线
function hump2Line(name: string) {
  return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}