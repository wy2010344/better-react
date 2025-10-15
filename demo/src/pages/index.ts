import { fdom } from "better-react-dom";

export default function () {
  fdom.div({
    className: "bg-red",
    children: "abc",
  });
}
