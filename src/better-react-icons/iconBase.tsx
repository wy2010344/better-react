
import { React } from '../better-react-dom/tsxSupport';
import { IconContext } from './iconContext';
import { createElement, BetterNode } from '../better-react-dom'
import { useContext } from 'better-react'


export interface IconTree {
  tag: string;
  attr: { [key: string]: string };
  child: IconTree[];
}


function Tree2Element(tree: IconTree[]): JSX.Element[] {
  return tree && tree.map((node, i) => createElement(node.tag, { key: i, ...node.attr }, Tree2Element(node.child)));
}
export function GenIcon(data: IconTree) {
  return (props: IconBaseProps) => (
    <IconBase attr={{ ...data.attr }} {...props} children={Tree2Element(data.child)} />
  );
}

export interface IconBaseProps extends React.SVGAttributes<SVGElement> {
  children?: BetterNode[];
  size?: string | number;
  color?: string;
  title?: string;
}

export type IconType = (props: IconBaseProps) => JSX.Element;
export function IconBase(props: IconBaseProps & { attr?: {} }): JSX.Element {
  const conf = useContext(IconContext)
  const { attr, size, title, ...svgProps } = props;
  const computedSize = size || conf.size || "1em";
  let className;
  if (conf.className) className = conf.className;
  if (props.className) className = (className ? className + ' ' : '') + props.className;

  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      {...conf.attr}
      {...attr}
      {...svgProps}
      className={className}
      style={{ color: props.color || conf.color, ...conf.style, ...props.style }}
      height={computedSize}
      width={computedSize}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      {props.children}
    </svg>
  )
}
