import { useEffect, useReducer } from "better-react";
import { LoadAfterResult, LoadData } from "./autoLoadMore";
import { useEvent } from "./useEvent";
import { PromiseResult, usePromise } from "./usePromise";
import { useChange, useChangeFun } from "./useState";
import { useVersion } from "./useVersion";
import { useCallback } from "./useCallback";
import { useAlways, useRef } from "./useRef";


type DataType<T, K> = {
  hasMore: boolean,
  nextKey: K
  list: T[]
}
/**
 * 
 * 加载更多的本质,是主加载未重载,本来只触发一次,但一直在触发
 * 查询条件是nextKey,
 * @param param0 
 * @returns 
 */
export function autoLoadMoreNew<T, K>({
  initDisabled,
  initKey,
  get
}: {
  /**首次是否禁止 */
  initDisabled?: boolean
  initKey: K
  get(key: K): Promise<DataType<T, K>>
}) {
  const [version, updateVersion] = useVersion()
  function initFun() {
    return {
      version,
      list: [],
      nextKey: initKey,
      hasMore: true
    }
  }
  const [value, setValue] = useChangeFun<{
    version: number
    list: T[],
    nextKey: K,
    hasMore: boolean,
    /**最后一次加载的错误 */
    error?: any
  }>(initFun)
  const reloading = value?.version != version //加载中
  /**
   * 这里如果禁止reloading中再加载,则无法及时响应用户变更选择.
   * 如果不禁止loading中加载,则需要在加载更多中去重.
   * 这里是连续的,不区分的
   * 一般是区分首次加载与加载更多.
   */
  usePromise({
    disable: initDisabled ? version == 0 : false,
    async body() {
      return get(value.nextKey)
    },
    onFinally(data) {
      if (data.type == 'success') {
        setValue({
          version,
          ...data.value,
          list: value.list.concat(data.value.list)
        })
      } else {
        setValue({
          ...value,
          version,
          error: data.value
        })
      }
    },
  }, [value.nextKey, version])

  //常不变的事件
  const loadMore: () => void = updateVersion
  const reload = useEvent(() => {
    setValue(initFun())
  })
  return {
    data: value,
    reloading,
    reload,
    loadMore
  }
}


type GetAfter<T, K> = (key: K) => Promise<LoadAfterResult<T, K>>;
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
  | AutoLoadMoreActionReload<T, K>
  | AutoLoadMoreActionLoadMore<T, K>
  | {
    type: "update";
    callback: UpdateCallBack<T>;
  };
type UpdateCallBack<T> = ((old: T[]) => T[]) | T[];
type AutoLoadMoreActionReload<T, K> = {
  type: "reload";
  getAfter: GetAfter<T, K>;
  data: PromiseResult<LoadAfterResult<T, K> & {
    version: number
  }>;
};
type AutoLoadMoreActionLoadMore<T, K> = {
  type: "loadMore";
  fromKey: K;
  version: number
  getAfter: GetAfter<T, K>;
  data: PromiseResult<LoadAfterResult<T, K>>;
};
function reducerAutoLoadMore<T, K>(
  old: AutoLoadMoreModel<T, K>,
  action: AutoLoadMoreAction<T, K>
): AutoLoadMoreModel<T, K> {
  if (action.type == "reload") {
    return {
      getAfter: action.getAfter,
      data: action.data,
    };
  } else if (action.type == "loadMore") {
    if (
      old &&
      old.data.type == "success" &&
      old.getAfter == action.getAfter &&
      old.data.value.nextKey == action.fromKey
    ) {
      const version = action.version
      return {
        ...old,
        data: {
          ...old.data,
          value:
            action.data.type == "success"
              ? {
                ...action.data.value,
                list: old.data.value.list.concat(action.data.value.list),
                loadMoreError: undefined,
                version,
              }
              : {
                ...old.data.value,
                loadMoreError: action.data.value,
                version,
              },
        },
      };
    }
  } else if (action.type == "update") {
    if (old && old.data.type == "success") {
      return {
        ...old,
        data: {
          ...old.data,
          value: {
            ...old.data.value,
            list:
              typeof action.callback == "function"
                ? action.callback(old.data.value.list)
                : action.callback,
          },
        },
      };
    }
  }
  debugLog("更新失败", action);
  return old;
}

function emptyWhenError(err: any) { }
/**
 *
 * T 列表类型
 * K 键类型
 * @param effect 获得列表的函数
 * @param deps 需要更新的函数
 * @returns
 */
export function useAutoLoadMore<T, K>(
  effect: GetAfter<T, K>,
  deps: readonly any[]
) {
  const [data, dispatch] = useReducer<AutoLoadMoreAction<T, K>, AutoLoadMoreModel<T, K>>(
    reducerAutoLoadMore,
  );
  const getAfter = useCallback(effect, deps);
  const judge = useAlways({
    shouldDispatchReload(oldGetAfter: GetAfter<T, K>) {
      return getAfter == oldGetAfter;
    },
    shouldDispatchLoadMore(oldGetAfter: GetAfter<T, K>, nextKey: K) {
      if (data?.data.type == "success") {
        return getAfter == oldGetAfter && nextKey == data.data.value.nextKey;
      }
      return false;
    },
  });
  //加载锁
  const loadMoreVersionRef = useRef(1)
  return {
    reloading: getAfter != data?.getAfter,
    data: data?.data,
    reload: useEvent(async function (initKey: K, whenError = emptyWhenError) {
      const version = loadMoreVersionRef.get() + 1
      loadMoreVersionRef.set(version)
      let action: AutoLoadMoreActionReload<T, K>;
      try {
        const value = await getAfter(initKey);
        action = {
          type: "reload",
          getAfter,
          data: {
            type: "success",
            value: {
              ...value,
              version
            },
          },
        };
      } catch (err) {
        action = {
          type: "reload",
          getAfter,
          data: {
            type: "error",
            value: err
          },
        };
      }
      if (judge().shouldDispatchReload(getAfter)) {
        dispatch(action);
        if (action.data.type == "error") {
          whenError(action.data.value);
        }
        return action;
      }
    }),
    loadMore: useEvent(function (whenError = emptyWhenError) {
      debugLog("触发更新", loadMoreVersionRef.get());
      if (data?.data.type == "success" && data.data.value.hasMore) {
        if (loadMoreVersionRef.get() != data.data.value.version) {
          return;
        }
        const version = loadMoreVersionRef.get() + 1
        loadMoreVersionRef.set(version)
        const getAfter = data.getAfter;
        const nextKey = data.data.value.nextKey;
        return didGetAfter(getAfter, nextKey, version).then((value) => {
          if (judge().shouldDispatchLoadMore(getAfter, nextKey)) {
            dispatch(value);
            if (value.data.type == "error") {
              whenError(value.data.value);
            }
            return value;
          }
        });
      }
    }),
    setList: useEvent(function (callback: UpdateCallBack<T>) {
      dispatch({
        type: "update",
        callback,
      });
    })
  }
}

async function didGetAfter<T, K>(getAfter: GetAfter<T, K>, fromKey: K, version: number) {
  let action: AutoLoadMoreActionLoadMore<T, K>;
  try {
    const value = await getAfter(fromKey);
    action = {
      type: "loadMore",
      getAfter,
      fromKey,
      version,
      data: {
        type: "success",
        value: value,
      },
    };
  } catch (err) {
    action = {
      type: "loadMore",
      getAfter,
      fromKey,
      version,
      data: {
        type: "error",
        value: err,
      },
    };
  }
  return action;
}

export function useVersionAutoLoadMore<T, K>({
  initKey,
  body,
}: {
  initKey: K;
  body: GetAfter<T, K>;
}, deps: readonly any[]) {
  const { data, reload, reloading, loadMore, setList } = useAutoLoadMore(body, deps);
  useEffect(() => {
    reload(initKey)
  }, deps);

  let loadMoreVersion = 0;
  let hasMore = false;
  let list: T[] = [];
  if (data?.type == "success") {
    loadMoreVersion = data.value.version || 0;
    hasMore = data.value.hasMore;
    list = data.value.list;
  }
  return {
    reloading,
    list,
    hasMore,
    loadMore,
    loadMoreVersion,
    setList,
  };
}
function debugLog(...vs: any[]) {
  console.log.apply(console, vs);

}