import { emptyFun, useEffect } from "better-react";
import { PromiseResult, buildPromiseResultSetData, useSerialRequestLoading } from "./usePromise";
import { useChange, useState } from "./useState";
import { useBuildSubSetObject } from "./util";

/**
 * 分页其实没必要
 * 使用usePromise里的一堆就可以
 * 以page为依赖的翻页——查询参数变化:page变1;或page手动变化
 *  查询依赖
 *    page
 * 或以version为依赖——可以对某一页重复刷新,即查询参数变化:page变为1、page手动变化、version手动变化
 *  查询依赖
 *    page
 *      version
 * 
 * 这里为了减少这种依赖,直接可以刷新
 *  查询依赖+version
 *  手动调用page
 * 
 * 这种,基于串行请求:useSerialRequest、useSerialRequestWithLoading
 * 
 */
/**
 * 所有页数
 * @param size 每页数量
 * @param count 总条数
 * @returns
 */
export function getTotalPage(size: number, count: number) {
  return Math.ceil(count / size);
}

type PromiseResultWithPage<T, K> = PromiseResult<T> & {
  page: K
}
/**返回里应该带有page */
type GetPage<T, K> = (page: K, signal?: AbortSignal) => Promise<T>;
function useBaseAsyncPaginate<T, K>(
  effect: (res: PromiseResultWithPage<T, K>) => void,
  initKey: K,
  getPage: GetPage<T, K>,
  /**deps里可以加version来实现刷新*/
  deps: readonly any[]
) {
  const [page, setPage] = useChange(initKey);
  const [request, loading] = useSerialRequestLoading(
    async function ([page]: [K], signal?: AbortSignal): Promise<PromiseResultWithPage<T, K>> {
      try {
        const out = await getPage(page, signal)
        return {
          type: "success",
          page,
          value: out
        }
      } catch (err) {
        return {
          type: "error",
          page,
          value: err
        }
      }
    },
    function (res) {
      if (res.type == 'success') {
        effect(res.value)
      }
    })
  useEffect(() => {
    setPage(initKey)
    request(initKey)
  }, deps)
  return {
    loading,
    page,
    /**重复调用都是刷新 */
    setPage(page: K) {
      setPage(page)
      request(page)
    }
  }
}

type NormalResult<T> = {
  list: T[];
  count: number;
}
/**
 * 任何一个deps改变都会触发强刷新
 * 或者强制reload,也会造成刷新
 * @param getPage
 * @param deps
 * @returns
 */
export function useAsyncPaginate<T>(
  {
    body,
    onError = emptyFun,
  }: {
    body: GetPage<
      NormalResult<T>,
      number
    >;
    onError?(err: any): void;
  },
  deps: readonly any[]
) {
  const [data, set_Data] = useState<PromiseResultWithPage<NormalResult<T>, number>>()
  const { page, loading, setPage } = useBaseAsyncPaginate(function (res) {
    set_Data(res)
    if (res.type == "error") {
      onError(res.value)
    }
  }, 1 as number, body, deps);
  const setData = buildPromiseResultSetData(set_Data)
  let count = 0;
  let list: T[] = [];
  const setList = useBuildSubSetObject(setData, "list");
  if (data?.type == "success") {
    count = data.value.count
    list = data.value.list
  }
  return {
    loading,
    list,
    count,
    page,
    setList,
    setPage
  };
}

async function toPromise<T, K>(
  getPage: GetPage<T, K>,
  key: K,
  signal?: AbortSignal
): Promise<PromiseResult<T>> {
  try {
    const value = await getPage(key, signal);
    return {
      type: "success",
      value,
    };
  } catch (err) {
    return {
      type: "error",
      value: err,
    };
  }
}
