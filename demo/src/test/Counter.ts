import { useDom } from "better-react-dom";
import { useState } from "better-react-helper";

export default function Counter() {
  const [count, setCount] = useState(0);
  console.log("count-render", count)

  useDom("button", {
    textContent: `数字${count}`,
    onClick(e) {
      e.stopPropagation()
      setCount(v => v + 1)
    },
  })
}