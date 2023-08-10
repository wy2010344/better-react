import { emptyArray, useEffect } from "better-react";
import { useEvent } from "better-react-helper";


export function useRequesetAnimationFrame(callback: () => void) {
  const cb = useEvent(callback);
  useEffect(() => {
    let open = true;
    function callback() {
      cb();
      if (open) {
        requestAnimationFrame(callback);
      }
    }
    requestAnimationFrame(callback);
    return function () {
      open = false;
    };
  }, emptyArray);
}
