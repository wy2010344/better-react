import { createContext } from "better-react";
import { React } from "../better-react-dom/tsxSupport";

export interface IconContext {
  color?: string;
  size?: string;
  className?: string;
  style?: React.CSSProperties;
  attr?: React.SVGAttributes<SVGElement>;
}

export const DefaultContext: IconContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined,
};

export const IconContext = createContext(DefaultContext);
