import {
  hookEnvModel,
  MemoEvent,
  useBaseMemo,
  useLevelEffect,
} from "better-react";
import {
  storeRef,
  quote,
  emptyArray,
  arrayNotEqualOrOne,
  GetValue,
  StoreRef,
} from "wy-helper";
import { useAttrEffect } from "./useEffect";
type MemoEffectSelf<T> = (e: MemoEvent<T, MemoEffectSelf<T>>) => T;
export function useMemo<V, D>(effect: (e: MemoEvent<V, D>) => V, deps: D): V;
export function useMemo<T>(effect: (e: MemoEffectSelf<T>) => T): T;
export function useMemo(effect: any) {
  const dep = arguments.length == 1 ? effect : arguments[1];
  return useBaseMemo(arrayNotEqualOrOne, effect, dep);
}
/**
 * 比如signal使用
 * @param v
 * @returns
 */
export function useConst<T>(v: T) {
  return useMemo(() => v, emptyArray);
}
/**
 * 构造一次性
 * @param creater
 * @param vs
 * @returns
 */
export function useConstFrom<F, Arg extends readonly any[] = readonly any[]>(
  creater: (...vs: Arg) => F,
  ...vs: Arg
) {
  return useMemo(() => {
    return creater(...vs);
  }, emptyArray);
}
/**
 * 其实就是useCallback
 * @param v
 * @param dep
 * @returns
 */
export function useConstDep<T>(v: T, dep?: any) {
  return useMemo(() => v, dep);
}
/**
 * 如果rollback,不允许改变是持久的
 * 但是ref本质上就是持久的
 * 返回的是对象
 * @param init
 * @returns
 */
export function useAtomBind<M, T>(init: M, trans: (m: M) => T): StoreRef<T>;
export function useAtomBind<T>(init: T): StoreRef<T>;
export function useAtomBind() {
  const [init, oldTrans] = arguments;
  return useMemo(() => {
    const trans = oldTrans || quote;
    const ref = storeRef(trans(init));
    ref.get = ref.get.bind(ref);
    ref.set = ref.set.bind(ref);
    return ref;
  }, emptyArray);
}
export function useAtomBindFun<T>(init: () => T) {
  return useAtomBind(undefined, init);
}

export function useAtom<M, T>(init: M, trans: (m: M) => T): StoreRef<T>;
export function useAtom<T>(init: T): StoreRef<T>;
export function useAtom() {
  const [init, oldTrans] = arguments;
  return useMemo(() => {
    const trans = oldTrans || quote;
    return storeRef(trans(init));
  }, emptyArray);
}
export function useAtomFun<T>(init: () => T) {
  return useAtom(undefined, init);
}

function createRef<T>(v: T) {
  return {
    current: v,
  };
}
export function useRef<T>(): {
  current: T | undefined;
};
export function useRef<T>(init: T): {
  current: T;
};
export function useRef<T>(init: null): {
  current: T | null;
};
export function useRef() {
  return useConstFrom(createRef, arguments[0]);
}
export function useRefFrom<F, Arg extends readonly any[] = readonly any[]>(
  creater: (...vs: Arg) => F,
  ...vs: Arg
) {
  return useMemo(() => {
    return {
      current: creater(...vs),
    };
  }, emptyArray);
}

function createLaterGet<T>() {
  const ref = storeRef<T | undefined>(undefined);
  ref.get = ref.get.bind(ref);
  return ref;
}

export function useLaterSetGet<T>() {
  return useMemo(createLaterGet, emptyArray) as StoreRef<T>;
}
/**
 * 始终获得render上的最新值
 * 由于useMemoGet的特性,返回的自动就是一个hook上的最新值
 * @param init
 * @returns
 */
export function useAlaways<T>(init: T) {
  const ref = useLaterSetGet<T>();
  ref.set(init);
  return ref.get as GetValue<T>;
}

/**
 * 在AttrEffect里才生效,
 * 会用到吗
 * @param init
 * @returns
 */
export function useEventAlaways<T>(init: T) {
  const ref = useAtomBind(init);
  useAttrEffect(() => {
    ref.set(init);
  });
  return ref.get;
}

/**
 * 在render中操作会回滚的ref
 * @param init
 * @param trans
 */
export function useChgAtom<M, T>(init: M, trans: (m: M) => T): StoreRef<T>;
export function useChgAtom<T>(init: T): StoreRef<T>;
export function useChgAtom() {
  const [init, oldTrans] = arguments;
  const envModel = hookEnvModel();
  return useMemo(() => {
    const trans = oldTrans || quote;
    return envModel.createChangeAtom(trans(init));
  }, emptyArray);
}
export function useChgAtomFun<T>(init: () => T) {
  return useChgAtom(undefined, init);
}

export function useRefConstWith<T>(v: T) {
  return useAtom(v).get();
}

export function useMemoVersion(...deps: any[]) {
  return useMemo(triggerAdd, deps);
}

function triggerAdd(e: MemoEvent<number, any>) {
  return (e.beforeValue || 0) + 1;
}

export type Ref<T> =
  | {
      current: T | null;
    }
  | ((v: T | null) => void);

function setRef<T>(fu: Ref<T>, v: null | T) {
  if (typeof fu == "function") {
    fu(v);
  } else {
    fu.current = v;
  }
}
export function useImperativeHandle<T, D = any>(
  ref: Ref<T>,
  create: () => T,
  deps: D,
) {
  useLevelEffect(
    -Infinity,
    arrayNotEqualOrOne,
    () => {
      setRef(ref, create());
    },
    deps,
  );
  useLevelEffect(
    Infinity,
    arrayNotEqualOrOne,
    () => {
      return [
        null,
        () => {
          setRef(ref, null);
        },
      ];
    },
    deps,
  );
}
