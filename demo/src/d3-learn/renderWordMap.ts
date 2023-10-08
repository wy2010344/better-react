import { emptyArray } from "better-react"
import { domOf, svgOf } from "better-react-dom"
import { renderIf, renderArray, useCallbackPromiseState } from "better-react-helper"
import { geoGraticule, geoNaturalEarth1, geoPath, json } from "d3"
import { feature, mesh } from 'topojson'

const projection = geoNaturalEarth1();
const path = geoPath(projection);
const graticule = geoGraticule()
export default function renderWorldMap() {

  const { data } = useCallbackPromiseState(async function () {
    const topology: any = await json('https://unpkg.com/world-atlas@2.0.2/countries-50m.json')
    const {
      countries,
      land
    } = topology.objects
    return {
      land: feature(topology, land),
      interiors: mesh(topology, countries, (a, b) => a != b)
    }
  }, emptyArray)

  console.log(data)

  renderIf(data?.type != 'success', function () {
    domOf("pre").renderTextContent("Loading...")
  }, function () {
    const out = data?.value

    const { land, interiors } = out
    const width = 960;
    const height = 500;
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
          fill:#C6C6C3;
          `
        }).render()
        //经纬度
        svgOf("path", {
          d: path(graticule()) || '',
          style: `
          fill:none;
          stroke:black;
          `
        }).render()
        //地图块
        renderArray(land.features, v => v, function (feature: any) {
          return svgOf("path", {
            d: path(feature) || '',
            style: `
            fill:#137B80;
            stroke:#C0C0BB;
            `
          }).render()
        })
        //国界
        svgOf("path", {
          d: path(interiors) || '',
          style: `
          fill:none;
          stroke:white;
          `
        }).render()
      })
    })
  })
}