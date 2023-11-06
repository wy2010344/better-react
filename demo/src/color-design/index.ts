import { normalPanel } from "@/panel/PanelContext";
import { dom } from "better-react-dom";
import { renderInput } from "better-react-dom-helper";
import { renderArray, useChange, useMemo } from "better-react-helper";
import chroma from 'chroma-js';

export default normalPanel(function () {
  const [primaryColor, setPrimaryColor] = useChange('#000000')

  const { accentColor, themeColors, } = useMemo(() => {
    // 将主题色转换为 chroma.js 颜色对象
    const primaryChromaColor = chroma(primaryColor);

    // 生成强调色（Accent Color）
    const accentColor = primaryChromaColor.saturate(2).hex();

    // 生成不同亮度的主题色
    const lightVariants = [
      primaryChromaColor.brighten(2).hex(),
      primaryChromaColor.brighten(1).hex(),
      primaryColor, // 主题色
      primaryChromaColor.darken(1).hex(),
      primaryChromaColor.darken(2).hex(),
    ];

    // 生成对应的文字颜色

    return {
      accentColor,
      themeColors: lightVariants.map(color => {
        return {
          background: color,
          saturate: chroma(color).saturate(2).hex(),
          color: chroma.contrast(color, 'white') >= 4.5 ? 'white' : 'black'
        }
      }),
    };
  }, [primaryColor])

  dom.div({
    style: `
      height:50px;
      background:${accentColor};
      `
  }).text`
      background:${accentColor};
    `

  renderArray(themeColors, v => v.background, function (v) {

    dom.div({
      style: `
      height:50px;
      background:${v.background};
      color:${v.color}
      `
    }).text`
      background:${v.background};
      color:${v.color}
    `
  })

  renderInput("input", {
    type: "color",
    value: primaryColor,
    onValueChange(v) {
      setPrimaryColor(v)
    },
  })

})