import { dom } from "better-react-dom";
import { SetValue } from "wy-helper";
import { figmaFetch } from "./util";



const FILE_ID = 'Onu2r1w8iZB6Jpk842SJiw'
const nodeId = '642-20619'

let count = 1

async function fetchImages() {
  const response = await figmaFetch(`/figma/v1/files/${FILE_ID}/images`);
  const fileData = await response.json()
  return fileData.meta.images as Record<string, string>
}
// 遍历文件节点，提取图片URL
async function fetchFigmaPng() {
  const response = await figmaFetch(`/figma/v1/files/${FILE_ID}?ids=${nodeId}`);
  const fileData = await response.json()
  const traverseNode = (node: any) => {
    if (node.fills) {
      node.fills.forEach((fill: any) => {
        if (fill.type === 'IMAGE') {
          count++
          if (count > 4) {
            return
          }
          //fill.imageRef

        }
      });
    }

    if (node.children) {
      node.children.forEach(traverseNode);
    }
  };
  fileData.document.children.forEach(traverseNode);
}


export default function (setValue: SetValue<string>) {

  dom.button({
    className: 'btn',
    onClick() {
      fetchFigmaPng().then(value => {
        setValue('成功')
      })
    }
  }).renderText`获得figma资源-png`
}