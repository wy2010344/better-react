import { PromiseAutoLoadMore, AutoLoadMoreAction, reducerAutoLoadMore } from "wy-helper";
import { useSideReducer } from "./useReducer";


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
  const [data, dispatch] = useSideReducer<AutoLoadMoreAction<T, K>, PromiseAutoLoadMore<T, K>>(
    reducerAutoLoadMore,
    PromiseAutoLoadMore.empty as any
  );
  return [data, dispatch] as const
}