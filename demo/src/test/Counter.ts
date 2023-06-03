import { useDom } from "better-react-dom";
import { useState } from "better-react-helper";

export default function Counter() {
  const [count, setCount] = useState(0);

  useDom("button", {
    textContent: `数字${count}`,
    onClick(event) {
      setCount(v => v + 1)
    },
  })
}