import { faker } from "@faker-js/faker";
import { dom } from "better-react-dom";
import { renderArray } from "better-react-helper";
import { emptyObject } from "wy-helper";
import { renderPage } from "../util/page";
import { cssMap, DomAttribute, DomAttributeS } from "wy-dom-helper";

const list = Array(500).fill(1).map((_, i) => {
	return {
		index: i,
		name: faker.animal.bear()
	}
})
export function renderTemplate(
	title: string,
	useRenderScroll: (container: HTMLElement, content: HTMLElement) => (() => DomAttributeS<"div">) | void
) {

	renderPage({
		title
	}, () => {

		dom.div({
			className: cs.title
		}).renderText`iScroll`
		dom.div({
			className: cs.container,
			onTouchMove(event) {
				event.preventDefault()
			},
		}).render(function (container) {

			const content = dom.div(function () {
				const attrs = getAttrs?.() || emptyObject as DomAttributeS<"div">
				return {
					...attrs,
					className: cs.content,
					style: attrs.style
				}
			}).render(function () {
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
							className: cs.row
						}).renderText`${row.index} ${row.name}`
					})
				})
			})
			const getAttrs = useRenderScroll(container, content)
		})
		dom.div({
			className: cs.footer
		}).render()
	})
}


const cs = cssMap({
	title: `
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
  `,
	container: `
    position: absolute;
		z-index: 1;
		top: 45px;
		bottom: 48px;
		left: 0;
		width: 100%;
		background: #ccc;
		overflow: hidden;
    `,
	content: `
      	position: absolute;
				z-index: 1;
				-webkit-tap-highlight-color: rgba(0,0,0,0);
				width: 100%;
				transform: translateZ(0);
				user-select: none;
				text-size-adjust: none;`,
	row: `       	
  padding: 0 10px;
	height: 40px;
	line-height: 40px;
	border-bottom: 1px solid #ccc;
	border-top: 1px solid #fff;
	background-color: #fafafa;
	font-size: 14px;
  `,
	footer: `
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
})