import { EmptyFun, emptyArray } from "better-react";
import { useEffect, useEvent } from "better-react-helper";
export function useRequesetAnimationFrame(run: EmptyFun) {
  useEffect(() => {
    let open = true;
    function callback() {
      run();
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


export function useRequesetAnimationFrameEvent(run: EmptyFun) {
  const cb = useEvent(run);
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
