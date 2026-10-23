import { dom, fdom } from "better-react-dom";
import { useChange } from "better-react-helper";

export default function () {
  const [count, setCount] = useChange(0);
  fdom.div({
    className:
      "max-w-sm mx-auto mt-16 bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center",
    children() {
      fdom.h2({
        className: "text-lg font-semibold text-gray-700 mb-6",
        childrenType: "text",
        children: "useChange 信号驱动计数器",
      });
      fdom.div({
        className:
          "text-5xl font-bold text-blue-600 mb-8 bg-blue-50 rounded-xl py-6",
        childrenType: "text",
        children: `${count}`,
      });
      fdom.div({
        className: "flex gap-3 justify-center",
        children() {
          fdom.button({
            className:
              "px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium",
            onClick() {
              setCount(count - 1);
            },
            childrenType: "text",
            children: "-1",
          });
          dom.button({
            className:
              "px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium",
            onClick() {
              setCount(count + 1);
            },
          }).renderText`click time ${count}`;
        },
      });
    },
  });
}
