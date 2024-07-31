import { renderArray, renderMax, useChange, useMemo } from "better-react-helper"
import { locationMatch, Route } from "../util/createRouter"
import { arrayCountCreateWith, emptyArray, quote } from "wy-helper"
import { dom } from "better-react-dom"

const routes: Route[] = [
  {
    match: locationMatch('/masonry'),
    page(v) {

      const list = useMemo(() => {

        return arrayCountCreateWith(100, i => {
          return {
            height: Math.random() * 30 + 20
          }
        })
      }, emptyArray)
      renderMasonry(3, list)
    },
  }
]



type Row = {
  height: number
}


function renderMasonry(
  column: number,
  list: Row[]
) {

  renderMax(column, quote, function (i) {
    const [ls, setLs] = useChange<Row>()

    dom.div().render(() => {
      dom.div(v => {
        v.style.height
      }).render()
    })
  })
}

export default routes