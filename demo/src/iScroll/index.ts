import { faker } from "@faker-js/faker";
import { dom } from "better-react-dom";
import { renderArray, useEffect } from "better-react-helper";
import { emptyArray } from "wy-helper";
import IScroll from './lite'
import BScroll from "better-scroll";

const list = Array(500).fill(1).map((_, i) => {
  return {
    index: i,
    name: faker.animal.bear()
  }
})
export default function () {
  const header = dom.div({
    style: `
	position: absolute;
	z-index: 2;
	top: 0;
	left: 0;
	width: 100%;
	height: 45px;
	line-height: 45px;
	background: #CD235C;
	padding: 0;
	color: #eee;
	font-size: 20px;
	text-align: center;
	font-weight: bold;
    `
  }).text`iScroll`
  const wrapper = dom.div({
    style: `
    	position: absolute;
	z-index: 1;
	top: 45px;
	bottom: 48px;
	left: 0;
	width: 100%;
	background: #ccc;
	overflow: hidden;
    `
  }).render(function () {
    const scroller = dom.div({
      style: `
      	position: absolute;
	z-index: 1;
	-webkit-tap-highlight-color: rgba(0,0,0,0);
	width: 100%;
	-webkit-transform: translateZ(0);
	-moz-transform: translateZ(0);
	-ms-transform: translateZ(0);
	-o-transform: translateZ(0);
	transform: translateZ(0);
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	-webkit-text-size-adjust: none;
	-moz-text-size-adjust: none;
	-ms-text-size-adjust: none;
	-o-text-size-adjust: none;
	text-size-adjust: none;
      `
    }).render(function () {

      useEffect(() => {
        const myScroll = new IScroll(wrapper, {
          mouseWheel: true
        })
        document.addEventListener('touchmove', function (e) { e.preventDefault(); }, {
          capture: false,
          passive: false
        });
      }, emptyArray)
      dom.ul({
        style: `
        	list-style: none;
	padding: 0;
	margin: 0;
	width: 100%;
	text-align: left;

        `
      }).render(function () {
        renderArray(list, v => v.index, function (row) {
          dom.li({
            style: `
            	padding: 0 10px;
	height: 40px;
	line-height: 40px;
	border-bottom: 1px solid #ccc;
	border-top: 1px solid #fff;
	background-color: #fafafa;
	font-size: 14px;
            `
          }).text`${row.index} ${row.name}`
        })
      })
    })
  })
  dom.div({
    style: `
    	position: absolute;
	z-index: 2;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 48px;
	background: #444;
	padding: 0;
	border-top: 1px solid #444;
    `
  }).render()
}