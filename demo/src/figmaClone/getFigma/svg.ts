import { parseXmlToText } from "@/xmlToBetter";
import { dom, svg } from "better-react-dom";
import { SvgAttributeS, SvgAttributeSO } from "wy-dom-helper";
import { SetValue } from "wy-helper";
import { figmaFetch } from "./util";
const FILE_ID = 'Onu2r1w8iZB6Jpk842SJiw'
//区域id
const nodeId = '1-34'
async function fetchFigmaIcons() {
  const response = await figmaFetch(`/figma/v1/files/${FILE_ID}?ids=${nodeId}`);
  const data = await response.json();
  /**https://www.figma.com/design/Onu2r1w8iZB6Jpk842SJiw/Legacy-iOS-UI-Kit-(Community)?node-id=1-34&t=GMKSesVB21NMa4If-4
   * https://www.figma.com/design/Onu2r1w8iZB6Jpk842SJiw/Legacy-iOS-UI-Kit-(Community)?node-id=1-21&t=GMKSesVB21NMa4If-4
   * https://www.figma.com/design/Onu2r1w8iZB6Jpk842SJiw/Legacy-iOS-UI-Kit-(Community)?node-id=1-2&t=GMKSesVB21NMa4If-4
   */
  const iconNodes = data.components
  const icons: string[] = [];
  // Step 2: 获取每个图标的 SVG URL 并处理为自定义格式
  const promisees: Promise<any>[] = []
  for (const iconId in iconNodes) {
    promisees.push(figmaFetch(
      `https://api.figma.com/v1/images/${FILE_ID}?ids=${iconId}&format=svg`,
    ).then(async iconResponse => {
      const name = iconNodes[iconId].name
      const toName = toCamelCase(name)
      const iconData = await iconResponse.json();
      const svgUrl = iconData.images[iconId];
      // 获取图标的实际 SVG 内容
      const svgResponse = await fetch(svgUrl);
      const svgContent = await svgResponse.text();
      const out = parseXmlToText(svgContent)

      const fun = `export function ${firstToUppercase(toName)}(props?:SvgProps){
      return ${out
          .replaceAll(`xmlns:"http://www.w3.org/2000/svg"`, `xmlns:"http://www.w3.org/2000/svg",\n...props`)
          .replaceAll(`fill:"black"`, `fill:"currentColor"`)
        }
    }`
      icons.push(fun)
    }))
  }
  await Promise.all(promisees)
  return icons.join('\n')
}
export default function (setValue: SetValue<string>) {
  dom.button({
    className: 'btn',
    onClick() {
      fetchFigmaIcons().then(value => {
        setValue(value)
      })
    }
  }).renderText`获得figma资源-svg`
}
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}
type SvgProps = SvgAttributeSO<'svg'> | SvgAttributeS<'svg'>

function firstToUppercase(n: string) {
  return `render${n[0].toUpperCase()}${n.slice(1)}`
}
export function renderCamera(props?: SvgProps) {
  return svg.svg({
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ...props
  }).render(() => {
    svg.path({
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M13.75 3C13.9075 3 14.0557 3.0741 14.1499 3.20001L15.35 4.80001C15.4444 4.92591 15.5926 5 15.75 5H17C17.5522 5 18 5.44772 18 6V15C18 15.5523 17.5522 16 17 16H3C2.44775 16 2 15.5523 2 15V6C2 5.44772 2.44775 5 3 5H4.25001C4.40738 5 4.55557 4.92591 4.65 4.80002L5.8501 3.20001C5.94434 3.0741 6.09253 3 6.25 3H13.75ZM10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6ZM10 7.5C11.3807 7.5 12.5 8.61929 12.5 10C12.5 11.3807 11.3807 12.5 10 12.5C8.61929 12.5 7.5 11.3807 7.5 10C7.5 8.61929 8.61929 7.5 10 7.5Z",
      fill: "currentColor"
    }).render()
  })
}