import { emptyArray, emptyFun, Quote, SetValue } from "wy-helper";
import { useOnlyId } from "./useOnlyId";
import { useChange, useState } from "./useState";
import { useMemo } from "./useRef";

/**
 * 最好的方法,在成功后也使用reset,失败后也使用reset
 * @param value
 * @param deps 依赖项,发生了更新
 * @returns
 */
export function useOptimisticCache<T>(value: T, deps: any = value) {
  const version = useOnlyId(deps);
  const [cache, setCache] = useChange<{
    version: number;
    value: T;
  }>();
  const isInCache = cache?.version == version;
  return [
    isInCache ? cache!.value : value,
    (value: T) => {
      setCache({
        value,
        version,
      });
    },
    isInCache,
    function () {
      //重置
      setCache(undefined);
    },
  ] as const;
}
type Op<T> = {
  id: number;
  callback: Quote<T>;
};
function callbackOb<T>(init: T, row: Op<T>) {
  return row.callback(init);
}
let uid = Number.MIN_SAFE_INTEGER;
export function useBatchOptimistic<T>(value: T, set: SetValue<Quote<T>>) {
  const [ops, setOps] = useState<readonly Op<T>[]>(emptyArray);
  return {
    originalValue: value,
    originalSet: set,
    value: useMemo(() => {
      return ops.reduce(callbackOb, value);
    }, [ops, value]),
    set(callback: Quote<T>) {
      const id = uid++;
      setOps((ops) =>
        ops.concat({
          id,
          callback,
        }),
      );
      function reset() {
        setOps((ops) => ops.filter((x) => x.id != id));
      }
      return {
        reset,
        id,
        commit() {
          set(callback);
          reset();
        },
      };
    },
    idInLoading(id: number) {
      return ops.find((x) => x.id == id);
    },
    opCountInWait: ops.length,
  };
}
