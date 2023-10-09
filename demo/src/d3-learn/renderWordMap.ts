import { emptyArray, render } from "better-react"
import { domOf, svg, svgOf } from "better-react-dom"
import { renderIf, renderArray, useCallbackPromiseState, PromiseResultSuccessValue } from "better-react-helper"
import { csv, geoGraticule, geoNaturalEarth1, geoPath, group, groups, json, max, scaleSqrt } from "d3"
import { feature, mesh } from 'topojson'

/**
 * 根据经纬度返回实际的像素位置
 */
const projection = geoNaturalEarth1();
const path = geoPath(projection);
const graticule = geoGraticule()
export default function renderWorldMap() {

  const { data } = useCallbackPromiseState(async function () {
    return Promise.all([
      async function () {
        /**
{
    "city": "Bamian",
    "lat": "34.8211",
    "lng": "67.521",
    "country": "Afghanistan",
    "population": "61863"
}
         */
        const data = await csv('https://gist.githubusercontent.com/curran/13d30e855d48cdd6f22acdf0afe27286/raw/0635f14817ec634833bb904a47594cc2f5f9dbf8/worldcities_clean.csv')

        return data.map(row => {
          return {
            ...row,
            country: row.country || '',
            city: row.city || '',
            lat: +(row.lat || 0),
            lng: +(row.lng || 0),
            population: +(row.population || 0)
          }
        })
      }(),
      async function () {
        const topology: any = await json('https://unpkg.com/world-atlas@2.0.2/countries-50m.json')
        const {
          countries,
          land
        } = topology.objects
        return {
          land: feature(topology, land as GeoJSON.GeometryCollection<any>),
          interiors: mesh(topology, countries, (a, b) => a != b)
        }
      }()
    ])
  }, emptyArray)

  console.log(data)

  renderIf(data?.type != 'success', function () {
    domOf("pre").renderTextContent("Loading...")
  }, function () {
    const [cities, out] = data?.value as PromiseResultSuccessValue<typeof data>
    const { land, interiors } = out
    const width = 960;
    const height = 500;


    const maxRadius = 5
    //通过开方,便面积与数量匹配,但按半径输入
    const sizeScale = scaleSqrt()
      .domain([0, max(cities, d => d.population) || 0])
      .range([0, maxRadius])



    return svgOf("svg", {
      width,
      height
    }).render(function () {
      svgOf("g").render(function () {
        //背景轮廓
        svgOf("path", {
          d: path({
            type: "Sphere"
          }) || '',
          style: `
  fill: #fbfbfb;
          `
        }).render()
        //经纬度
        svgOf("path", {
          d: path(graticule()) || '',
          style: `
          fill:none;
  stroke: #ececec;
          `
        }).render()
        //地图块
        renderArray(land.features, v => v, function (feature: any) {
          return svgOf("path", {
            d: path(feature) || '',
            style: `
  fill: #ececec;
            `
          }).render()
        })
        //国界
        svgOf("path", {
          d: path(interiors) || '',
          style: `
          fill:none;
  stroke: #d9dfe0;
          `
        }).render()

        //人口的分布点
        renderArray(cities, v => `${v.country} ${v.city}`, function (d) {
          const [x, y] = projection([d.lng, d.lat]) || [0, 0]
          svg.circle({
            style: `
            fill: #137B80;
  opacity: 0.3;
            `,
            cx: x,
            cy: y,
            r: sizeScale(d.population)
          }).render()
        })
      })
    })
  })
}