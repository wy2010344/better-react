import { renderIf, renderArray, useCallbackPromiseState, useMemo } from "better-react-helper";
import { panelWith } from "../panel/PanelContext";
import { emptyArray } from "better-react";
import { DSVRowArray, csv, arc, svg, pie, scaleBand, scaleLinear, max, format } from "d3";
import { domOf, svgOf } from "better-react-dom";
import renderWorldMap from "./renderWordMap";

export default panelWith({
  initWidth: 800,
  children(operate, id, arg) {
    // renderColorPie()
    // renderPopulartation()
    // renderScatter()
    renderWorldMap()
  },
})


function renderScatter() {

  const { data } = useCallbackPromiseState(function () {
    return csv('https://gist.githubusercontent.com/curran/a08a1080b88344b0c8a7/raw/639388c2cbc2120a14dcf466e85730eb8be498bb/iris.csv')
  }, emptyArray)


}


function renderPopulartation() {

  const { data } = useCallbackPromiseState(function () {
    return csv('https://gist.githubusercontent.com/curran/0ac4077c7fc6390f5dd33bf5c06cb5ff/raw/605c54080c7a93a417a3cea93fd52e7550e76500/UN_Population_2019.csv')
  }, emptyArray)
  const width = 700
  const height = 500
  const margin = { top: 20, right: 20, bottom: 40, left: 200 };


  const innerHeight = height - margin.top - margin.bottom;
  const innerWidth = width - margin.left - margin.right;


  renderIf(data?.type != 'success', function () {
    domOf("pre").renderTextContent("Loading...")
  }, function () {
    const out = data?.value as DSVRowArray<string>
    const list = useMemo(() => {
      return out.slice(0, 10).map(row => {
        return {
          Country: row.Country || '',
          Population: parseInt(row['2020'] || '0') * 1000
        }
      })
    }, [out])

    const xValue =
      svgOf("svg", {
        width,
        height
      }).render(function () {
        const yScale = scaleBand()
          .domain(list.map(d => d.Country))
          .range([0, innerHeight])
          .paddingInner(0.5)
        const xScale = scaleLinear().domain([0, max(list, d => d.Population) || 0]).range([0, innerWidth])

        svgOf("g", {
          transform: `translate(${margin.left},${margin.top})`
        }).render(function () {

          //AxisLeft
          renderArray(yScale.domain(), v => v, function (tick) {
            svgOf("text", {
              x: -3,
              dy: '0.32em',
              textAnchor: "end",
              y: (yScale(tick) || 0) + (yScale.bandwidth() / 2)
            }).renderTextContent(tick)
          })
          svgOf("text", {
            x: innerWidth / 2,
            y: innerHeight + 35,
            textAnchor: "middle",
            style: `
              font-size:1em;
              fill:#689943;
              `
          }).renderTextContent("Population")
          //AxisBottom
          renderArray(xScale.ticks(), v => v, function (tick) {
            svgOf("g", {
              transform: `translate(${xScale(tick)},0)`
            }).render(function () {
              svgOf("line", {
                y2: innerHeight,
                stroke: "black"
              }).render()
              svgOf("text", {
                textAnchor: "middle",
                dy: "0.71em",
                y: innerHeight + 3
              }).renderTextContent(format('.2s')(tick))
            })
          })

          //marker
          renderArray(list, v => v.Country, function (row) {
            svgOf("rect", {
              y: yScale(row.Country),
              width: xScale(row.Population),
              height: yScale.bandwidth()
            }).render()
          })
        })
      })
  })
}




function renderColorPie() {
  const pieArc = arc()
    .innerRadius(0)
    .outerRadius(200)
  const width = 500
  const height = 500



  const { data } = useCallbackPromiseState(function () {
    return csv('https://gist.githubusercontent.com/curran/b236990081a24761f7000567094914e0/raw/cssNamedColors.csv')
  }, emptyArray)
  renderIf(data?.type != 'success', function () {
    domOf("pre").renderTextContent('Loading...')
  }, function () {
    const out = data?.value as DSVRowArray<string>
    console.log(out[0])
    svgOf("svg", {
      width,
      height,
    }).render(function () {
      svgOf("g", {
        transform: `translate(${width / 2},${height / 2})`
      }).render(function () {
        //绘制居中


        // renderArray(pie().value(1)(out as any), v => v.index, function (row: any) {
        //   return svgOf("path", {
        //     fill: row.data['RGB hex value']!,
        //     d: pieArc(row) || ''
        //   }).render()
        // })
        renderArray(out, v => v.Keyword, function (row, i) {
          svgOf("path", {
            fill: row['RGB hex value'],
            d: pieArc({
              innerRadius: 0,
              outerRadius: 200,
              startAngle: (i / out.length) * 2 * Math.PI,
              endAngle: ((i + 1) / out.length) * 2 * Math.PI
            }) || ''
          }).render()
        })
      })
    })
  })
}