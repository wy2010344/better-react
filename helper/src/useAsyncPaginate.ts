import { EmptyFun, emptyFun, useEffect } from "better-react";
import { PromiseResult, createAndFlushAbortController } from "./usePromise";
import { useChange, useState } from "./useState";
import { useCallback } from "./useCallback";
import { useEvent } from "./useEvent";
import { useBuildSubSetObject } from "./util";
import { useVersionLock } from "./Lock";
import { useRef } from "./useRef";

/**
 * 所有页数
 * @param size 每页数量
 * @param count 总条数
 * @returns
 */
export function getTotalPage(size: number, count: number) {
  return Math.ceil(count / size);
}

type GetPage<T, K> = (page: K, signal?: AbortSignal) => Promise<T>;
type AsyncPaginateModel<T, K> =
  | {
    page: K;
    version: number;
    data: PromiseResult<T>;
  }
  | undefined;
function useAsyncPaginate3<T, K>(getPage: GetPage<T, K>) {
  const [data, setData] = useState<AsyncPaginateModel<T, K>>();
  const [getVersion, updateVersion] = useVersionLock()
  const [version, setVersion] = useState<number>();
  const lastCancelRef = useRef<EmptyFun | undefined>(undefined)
  return {
    data,
    loading: version != data?.version,
    setData: useCallback(function (callback: T | ((old: T) => T)) {
      setData((old) => {
        if (old?.data.type == "success") {
          return {
            ...old,
            data: {
              ...old.data,
              value:
                typeof callback == "function"
                  ? (callback as any)(old.data.value)
                  : callback,
            },
          };
        }
        return old;
      });
    }, []),
    getPage: useEvent(function (page: K, onError: (err: any) => void) {
      //可以重复请求,后覆盖前
      const version = updateVersion()
      setVersion(version);
      return toPromise(getPage, page, createAndFlushAbortController(lastCancelRef)).then((data) => {
        if (getVersion() == version) {
          if (data.type == "error") {
            onError(data.value);
          }
          setData({
            page,
            version,
            data,
          });
        }
      });
    }),
  };
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
      {
        list: T[];
        count: number;
      },
      number
    >;
    onError?(err: any): void;
  },
  deps: readonly any[]
) {
  const { data, loading, getPage, setData } = useAsyncPaginate3(body);
  const [page, setPage] = useChange(1);
  useEffect(() => {
    getPage(1, onError);
    setPage(1);
  }, deps);

  let count = 0;
  let list: T[] = [];
  const setList = useBuildSubSetObject(setData, "list");
  if (data?.data.type == "success") {
    (count = data.data.value.count), (list = data.data.value.list);
  }
  return {
    loading,
    list,
    count,
    page,
    setList,
    setPage(n: number) {
      setPage(n);
      getPage(n, onError);
    },
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
