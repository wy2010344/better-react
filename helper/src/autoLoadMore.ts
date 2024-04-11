import { AutoLoadMoreCore, PromiseAutoLoadMore, SetValue, VersionPromiseResult, emptyArray } from "wy-helper";
import { useCallback } from "./useCallback";
import { useReducer } from "./useReducer";
type AutoLoadMoreAction<T, K> =
  {
    type: "reload";
    getAfter(k: K, abort?: AbortSignal): Promise<AutoLoadMoreCore<T, K>>
    first: K
  } | {
    type: "loadMore";
    version: number
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
  action: AutoLoadMoreAction<T, K>,
  nextTick: SetValue<SetValue<SetValue<AutoLoadMoreAction<T, K>>>>
): PromiseAutoLoadMore<T, K> {
  if (action.type == "reload") {
    return old.reload(
      action.getAfter,
      action.first,
      function (value) {
        nextTick(function () {

        })
        dispatch({
          type: "reloadBack",
          value
        })
      })
  } else if (action.type == "loadMore") {
    return old.loadMore(action.version, function (value) {
      dispatch({
        type: "loadMoreBack",
        value
      })
    })
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
  return [data, dispatch]
}