import { faker } from "@faker-js/faker";
import { DomAttribute, dom } from "better-react-dom";
import { renderArray } from "better-react-helper";
import { emptyObject } from "wy-helper";

const list = Array(2000).fill(1).map((_, i) => {
	return {
		index: i,
		name: faker.animal.bear()
	}
})
export function renderTemplate(
	useRenderScroll: (wrapper: HTMLElement, container: HTMLElement) => (() => DomAttribute<"div">) | void
) {

	dom.div({
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
	}).renderText`iScroll`
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
    `,
		onTouchMove(event) {
			event.preventDefault()
		},
	}).renderFragment(function () {

		const container = dom.div(function () {
			const attrs = getAttrs?.() || emptyObject as DomAttribute<"div">
			return {
				...attrs,
				style: `
      	position: absolute;
				z-index: 1;
				-webkit-tap-highlight-color: rgba(0,0,0,0);
				width: 100%;
				transform: translateZ(0);
				user-select: none;
				text-size-adjust: none;
				${attrs?.style || ''}
      `,
			}
		}).renderFragment(function () {
			dom.ul({
				style: `
        	list-style: none;
	padding: 0;
	margin: 0;
	width: 100%;
	text-align: left;

        `
			}).renderFragment(function () {
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
					}).renderText`${row.index} ${row.name}`
				})
			})
		})
		const getAttrs = useRenderScroll(wrapper, container)
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