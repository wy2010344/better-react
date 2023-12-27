import { emptyArray, quote } from "better-react"
import { useEffect } from "./useEffect";
import { ValueCenter } from "./ValueCenter";
import { useChange } from "./useState";
import { useAtomBind } from "./useRef";
import { useCallback } from "./useCallback";
type RefState<T> = [T, (v: T) => void, () => T]
export function useRefState<T, M>(init: M, trans: (v: M) => T): RefState<T>
export function useRefState<T>(init: T): RefState<T>
export function useRefState() {
  const [init, trans] = arguments
  const [state, setState] = useChange(init, trans)
  const lock = useAtomBind(state)

  const setValue = useCallback((value) => {
    if (value != lock.get()) {
      lock.set(value)
      setState(value)
    }
  }, emptyArray)
  return [state, setValue, lock.get]
}


/**
 *
 * @param store
 * @param arg 只能初始化,中间不可以改变,即使改变,也是跟随的
 */
export function useStoreTriggerRender<T, M>(store: ValueCenter<T>, arg: {
  filter(a: T): M;
  onBind?(a: M): void;
}): M;
export function useStoreTriggerRender<T>(store: ValueCenter<T>, arg?: {
  filter?(a: T): T;
  onBind?(a: T): void;
}): T;
export function useStoreTriggerRender<T>(store: ValueCenter<T>) {
  const arg = arguments[1];
  const filter = arg?.filter || quote;
  const [state, setState] = useRefState(store.get(), filter);
  useEffect(function () {
    function setValue(v: T) {
      const newState = filter(v) as T;
      setState(newState);
      return newState;
    }
    const newValue = store.get() as T;
    setValue(newValue);
    arg?.onBind?.(newValue);
    return store.subscribe(setState);
  }, [store]);
  return state;
}
