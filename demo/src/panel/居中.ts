import { useDom } from 'better-react-dom'
import { PanelCallback, PanelOperate } from './PanelContext'
import { PanelParams } from './renderPanel'
import { stringifyStyle } from "wy-dom-helper";


export function use居中(body: () => void) {
	return useDom("div", {
		style: stringifyStyle({
			position: "fixed",
			width: "100%",
			height: "100%",
			top: "0",
			left: "0"
		}),
		children() {
			/**遮罩 */
			useDom("div", {
				style: stringifyStyle({
					position: "absolute",
					width: "100%",
					height: "100%",
					top: "0",
					left: "0",
					background: "gray",
					opacity: "0.1"
				})
			})
			//主界面
			useDom("div", {
				style: stringifyStyle({
					position: "absolute",
					width: "100%",
					height: "100%",
					top: "0",
					left: "0",
					display: "table"
				}),
				children() {
					//中心区块
					useDom("div", {
						style: stringifyStyle({
							display: "table-cell",
							textAlign: "center",
							verticalAlign: "middle"
						}),
						children: body,
					})
				}
			})
		}
	})
}



export function alertWith<T>(children: (operate: PanelOperate, id: number, arg: T) => void): PanelCallback<T> {
	return function (operate, value) {
		const id = operate.push(function () {
			use居中(function () {
				children(operate, id, value)
			})
		})
	}
}