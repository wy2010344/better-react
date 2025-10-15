import { dom } from "better-react-dom";
import { useChange } from "better-react-helper";

export default function () {
  const [count, setCount] = useChange(0);
  dom.button({
    onClick() {
      setCount(count + 1);
    },
  }).renderText`click time ${count}`;
}
