import { AutoLoadMoreCore, EmptyFun, PromiseAutoLoadMore, PromiseResult, SetValue, VersionPromiseResult, emptyArray, emptyFun } from "wy-helper";
import { useEvent } from "./useEvent";
import { createAndFlushAbortController } from "./usePromise";
import { useCallback } from "./useCallback";
import { useAlways, useAtomBind, useMemo } from "./useRef";
import { useVersionLock } from "./Lock";
import { useReducer } from "./useReducer";
import { useEffect } from "./useEffect";

export type LoadAfterResult<T, K> = {
  list: T[]
  nextKey: K
  hasMore: boolean
}
type GetAfter<T, K> = (key: K) => Promise<LoadAfterResult<T, K>>;
type GetAfterEffect<T, K> = (key: K, signal?: AbortSignal) => Promise<LoadAfterResult<T, K>>;
type AutoLoadMoreModel<T, K> =
  | {
    getAfter: GetAfter<T, K>;
    data: PromiseResult<
      LoadAfterResult<T, K> & {
        /**最新一次加载更多,可能是失败 */
        loadMoreError?: any;
        version: number;
      }
    >;
  }
  | undefined;
type AutoLoadMoreAction<T, K> =
  {
    type: "reload";
    getAfter(k: K, abort?: AbortSignal): Promise<AutoLoadMoreCore<T, K>>
    first: K,
    dispatch(v: VersionPromiseResult<AutoLoadMoreCore<T, K>>): void
  } | {
    type: "loadMore";
    version: number
    dispatch: SetValue<VersionPromiseResult<AutoLoadMoreCore<T, K>>>
  } | {
    type: "reloadBack"
    value: VersionPromiseResult<AutoLoadMoreCore<T, K>>
  } | {
    type: "loadMoreBack"
    value: VersionPromiseResult<AutoLoadMoreCore<T, K>>
  }
  | Update<T>;

type Update<T> = {
  type: "update";
  callback(old: T[]): T[]
}
function reducerAutoLoadMore<T, K>(
  old: PromiseAutoLoadMore<T, K>,
  action: AutoLoadMoreAction<T, K>
): PromiseAutoLoadMore<T, K> {
  if (action.type == "reload") {
    return old.reload(
      action.getAfter,
      action.first,
      action.dispatch)
  } else if (action.type == "loadMore") {
    return old.loadMore(action.version, action.dispatch)
  } else if (action.type == 'reloadBack') {
    return old.reloadBack(action.value)
  } else if (action.type == 'loadMoreBack') {
    return old.loadMoreBack(action.value)
  } else if (action.type == 'update') {
    return old.update(action.callback)
  }
  return old;
}
/**
 * 
 * 与useAsyncPaginage的同异性
 * useAsyncPaginage不用关心历史,而这个是需要叠加到历史中
 * 所有依赖更新都将导致从第一页重新开始,或version增加的刷新
 * 加载下一页依赖上一页的结束标识
 *  开始时必须是未加载状态
 *  reduce进入时,必须和上一次的版本相同
 *
 * T 列表类型
 * K 键类型
 * @param effect 获得列表的函数
 * @param deps 需要更新的函数
 * @returns
 */
export function useAutoLoadMore<T, K>() {
  PromiseAutoLoadMore
  const [data, dispatch] = useReducer<AutoLoadMoreAction<T, K>, PromiseAutoLoadMore<T, K>>(
    reducerAutoLoadMore,
  );

  const outDispatch = useCallback((action: {
    type: "reload";
    getAfter(k: K, abort?: AbortSignal): Promise<AutoLoadMoreCore<T, K>>
    first: K,
  } | {
    type: "loadMore";
    version: number
  } | Update<T>) => {
    if (action.type == 'reload') {
      dispatch({
        ...action,
        dispatch(value: VersionPromiseResult<AutoLoadMoreCore<T, K>>) {
          dispatch({
            type: "reloadBack",
            value
          })
        }
      })
    } else if (action.type == "loadMore") {
      dispatch({
        ...action,
        dispatch(value: VersionPromiseResult<AutoLoadMoreCore<T, K>>) {
          dispatch({
            type: "loadMoreBack",
            value
          })
        }
      })
    } else if (action.type == "update") {
      dispatch(action)
    }
  }, emptyArray)
  return [data, outDispatch]
}