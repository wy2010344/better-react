import { dom } from "better-react-dom"

import {


  Stream, toArray, KSubsitution, walk
} from 'wy-helper/kanren'
import { map, goal } from "./d1"
// import { map, stream as bstream } from './tk'

// let stream = bstream
let stream: Stream<KSubsitution> | undefined = goal(null)
export default function () {
  dom.div().render(function () {
    dom.button({
      onClick() {
        console.log("stream", stream, map)
        const sub = stream?.left
        if (sub) {
          const lv = toArray(sub)
          console.log("作用域", lv)
          map.forEach((value, key) => {
            console.log("key--", key, "--value--", toArray(walk(value, sub)))
          })
        }
        stream = stream?.right() || null
      }
    }).renderText`生成`
  })
}