# better-react-dom



export some dom operation for better-react.

scheduleAskTime

isSVG

createRoot(node,recocile,ask)

hooks:
* useContent
* useDom
* useSvg


types:
* DomElements
* DomElementType
* DomAttribute
* DomELement
* SvgElements
* SvgElementType = keyof SvgElements
* SvgAttribute\<T extends SvgElementType> = SvgElements[T]
* SvgElement\<T>