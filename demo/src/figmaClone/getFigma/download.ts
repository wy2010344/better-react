import legcyIOS from './legcyiOS.json'
import { figmaFetch } from './util';
import fs from 'fs/promises'

const FILE_ID = 'Onu2r1w8iZB6Jpk842SJiw'
const nodeId = '642-20619'

async function down() {

  const response = await figmaFetch(`/figma/v1/files/${FILE_ID}?ids=${nodeId}`);
  const fileData = await response.json()

  const abc = { ...legcyIOS } as Record<string, any>
  const promises: Promise<any>[] = []
  console.log(abc)
  const traverseNode = (node: any) => {
    if (node.fills) {
      node.fills.forEach((fill: any) => {
        const id = fill.imageRef
        const url = abc[id]
        if (typeof url == 'string') {
          promises.push(fetch(url).then(async resp => {
            const buffer = Buffer.from(await resp.arrayBuffer())
            fs.writeFile(`./img/${id}.png`, buffer)
            abc[id] = {
              url,
              saved: true
            }
          }))
        } else {
          console.log("跳过")
        }
      });
    }

    if (node.children) {
      node.children.forEach(traverseNode);
    }
  };
  fileData.document.children.forEach(traverseNode);

  Promise.all(promises).then(v => {
    fs.writeFile('./legcyiOS.json', JSON.stringify(abc))
  })
}

down()