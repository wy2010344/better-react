import { fdom } from "better-react-dom";
import { EmptyFun } from "wy-helper";

export default function (arg: any, children: EmptyFun) {
  fdom.div({
    className: "p-20",
    children,
  });
}
