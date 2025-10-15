import {
  Compare,
  emptyArray,
  genTemplateStringS2,
  GetValue,
  SetValue,
  simpleNotEqual,
  VType,
  SyncFun,
  createSignal,
  memo,
  trackSignal,
  collectSignal,
} from "wy-helper";
import { useConstDep, useConstFrom, useMemo } from "./useRef";
import { useEffect } from "./useEffect";
import { useChange, useChangeFun, useRefValueFun } from "./useState";
import { hookRequestReconcile } from "better-react";

export function useSignal<T>(n: T, shouldChange: Compare<T> = simpleNotEqual) {
  return useConstFrom(() => createSignal(n, shouldChange));
}

export function useSignalFrom<T>(
  n: () => T,
  shouldChange: Compare<T> = simpleNotEqual,
) {
  return useConstFrom(() => createSignal(n(), shouldChange));
}

/**
 * 动态依赖改变
 * @param fun
 * @param deps
 * @returns
 */
export function useComputed<T>(fun: GetValue<T>, shouldChange?: Compare<T>) {
  return useMemo(() => memo(fun, shouldChange), emptyArray);
}
/**
 * get与shouldChange只使用第一次
 * @param get
 * @param shouldChange
 * @returns
 */
export function useSignalState<T>(
  get: GetValue<T>,
  shouldChange: Compare<T> = simpleNotEqual,
) {
  const [a, set] = useChangeFun(get);
  useEffect(() => {
    //有可能重复设置?
    return trackSignal(get, (v) => {
      set(v);
    });
  }, emptyArray);
  return a;
}

export function useSignalEffect<T>(get: GetValue<T>, callback: SetValue<T>) {
  useEffect(() => {
    return trackSignal(get, callback);
  }, emptyArray);
}

export function useSignalSyncDep<T>(get: GetValue<T>, dep?: any) {
  return useConstDep<SyncFun<T>>(function () {
    const [set, a, b, c] = arguments;
    return trackSignal(get, function (v) {
      set(v, a, b, c);
    });
  }, dep);
}
export function useSignalSync<T>(get: GetValue<T>) {
  return useSignalSyncDep(get, emptyArray);
}
export function useSignalSyncTemplate(
  ts: TemplateStringsArray,
  ...vs: VType[]
) {
  return useSignalSyncDep(() => {
    return genTemplateStringS2(ts, vs);
  }, vs);
}

/**
 * 类似mobx的observer
 * @param fc
 * @returns
 */
export function observer<T>(fc: () => T) {
  const reconcile = hookRequestReconcile();
  const c = useConstFrom(() => collectSignal(reconcile));
  useEffect(() => {
    return c.destroy;
  }, emptyArray);
  return c.collect(fc, true);
}
