import { faker } from "@faker-js/faker";
import { dom } from "better-react-dom";
import { renderArray, useEffect } from "better-react-helper";
import { emptyArray } from "wy-helper";
import IScroll from './lite'
import BScroll from "@better-scroll/core";
import { renderTemplate } from "./template";

const list = Array(500).fill(1).map((_, i) => {
	return {
		index: i,
		name: faker.animal.bear()
	}
})
export default function () {
	return renderTemplate(function (wrapper, getContainer) {

		useEffect(() => {
			new IScroll(wrapper, {
				useTransition: false
			})
			// const myScroll = new IScroll(wrapper, {
			// 	mouseWheel: true,
			// 	useTransition: true
			// })
			// document.addEventListener('touchmove', function (e) { e.preventDefault(); }, {
			// 	capture: false,
			// 	passive: false
			// });
		}, emptyArray)
		return function () {
			return ''
		}
	})
}