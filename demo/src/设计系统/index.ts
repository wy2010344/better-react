import { useDom } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";

export default normalPanel(function (operate, id) {
  useDom("div", {
    textContent: "设计系统"
  })
})


type DesignSystem = {
  name: string
  url: string
  /**可访问性 */
  accessibility?: boolean
  /**声明和语气,指个性? 
https://www.frontitude.com/blog/defining-your-products-voice-and-tone-for-the-best-ux
正式（休闲或正式）
热情（热情或实事求是）
尊重（不尊重或尊重）
幽默（滑稽或严肃）
专业性（专业或个人） 
机构（传统或创新/尖端） 
无障碍设施（豪华/独家或所有人都可以使用） 
  */
  toneofvoice?: boolean
  description: string
}

/**
 * 参考来源
 * https://component.gallery/design-systems
 */

const designSystems: DesignSystem[] = [
  {
    name: "Base Web",
    url: `https://baseweb.design/`,
    description: `
    Uber出品

    比较喜欢的粗黑白风
    `
  },
  {
    name: "Chakra UI",
    url: `https://chakra-ui.com/`,
    description: `
    使用了 @emotion/react @emotion/styled framer-motion
    
    `,
    accessibility: true
  },
  {
    name: "Spectrum",
    url: `https://react-spectrum.adobe.com/`,
    description: `
    adobe出品
    包括 React Aria 可访问性
    React Spectrum
    React Stately
    `,
    /**应该是有的 */
    accessibility: true,
  },
  {
    name: "Blueprint",
    url: `https://blueprintjs.com`,
    description: `
    
    `
  },
  {
    name: "Paste",
    url: `https://paste.twilio.design/`,
    description: `
    
    `
  }
]