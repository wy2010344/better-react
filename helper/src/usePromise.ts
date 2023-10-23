import { StoreRef, useEffect } from "better-react"
import { useEvent } from "./useEvent"
import { useChange, useState } from "./useState"
import { useMemo, useRef } from "./useRef"
import { EmptyFun, FalseType, emptyArray, storeRef } from "better-react/dist/util"
import { useVersionInc, useVersionLock } from "./Lock"
import { useCallback } from "./useCallback"
import { ReduceState, SetStateAction } from "./ValueCenter"
import { useReducer } from "./useReducer"

export type PromiseResult<T> = {
  type: "success",
  value: T
} | {
  type: "error",
  value: any
}
export type PromiseResultSuccessValue<T> = T extends {
  type: "success"
  value: infer V
} ? V : never

type GetPromiseRequest<T> = (signal?: AbortSignal, ...vs: any[]) => Promise<T>;
export type GetPromise<T> = {
  request: GetPromiseRequest<T>
  version: number
}
type GetPromiseResult<T> = PromiseResult<T> & {
  getPromise: GetPromise<T>
}
type OnFinally<T> = (
  data: GetPromiseResult<T>,
  ...vs: any[]
) => void
function usePromise<T>(
  getPromise: GetPromise<T> | FalseType,
  initOnFinally: OnFinally<T>
) {
  const onFinally = useEvent(function (data: GetPromiseResult<T>) {
    if (getPromise == data.getPromise) {
      initOnFinally(data)
    }
  })
  useEffect(doGetPromise as any, [getPromise, onFinally])
}
function createAbortController() {
  if ("AbortController" in globalThis) {
    const signal = new AbortController();
    return {
      signal: signal.signal,
      cancel() {
        signal.abort();
      },
    };
  }
  return {
    signal: undefined,
    cancel() { },
  };
}
export function createAndFlushAbortController(ref: StoreRef<EmptyFun | undefined>) {
  const controller = createAbortController()
  const last = ref.get()
  if (last) {
    last()
  }
  ref.set(controller.cancel)
  return controller.signal
}

function doGetPromise<T>([getPromise, onFinally]: [GetPromise<T> | FalseType, (data: GetPromiseResult<T>) => void]) {
  if (getPromise) {
    const signal = createAbortController();
    getPromise.request(signal.signal).then(data => {
      onFinally({ type: "success", value: data, getPromise })
    }).catch(err => {
      onFinally({ type: "error", value: err, getPromise })
    })
    return signal.cancel
  }
}

type OutPromiseOrFalse<T> = (GetPromiseRequest<T>) | FalseType;
export function useMemoPromiseCall<T, Deps extends readonly any[]>(
  onFinally: OnFinally<T>,
  effect: (deps: Deps, ...vs: any[]) => OutPromiseOrFalse<T>,
  deps: Deps
) {
  const inc = useVersionInc()
  const getPromise = useMemo(() => {
    const request = effect(deps)
    if (request) {
      const version = inc()
      return {
        request,
        version
      }
    }
  }, deps)
  usePromise(getPromise, onFinally)
  return getPromise
}
export function useCallbackPromiseCall<T, Deps extends readonly any[]>(
  onFinally: OnFinally<T>,
  request: GetPromiseRequest<T>,
  deps: Deps
) {
  const inc = useVersionInc()
  const getPromise = useMemo((dep) => {
    const version = inc()
    return {
      version,
      request
    }
  }, deps)
  usePromise(getPromise, onFinally)
  return getPromise
}
export function buildPromiseResultSetData<F extends PromiseResult<any>>(
  updateData: ReduceState<F | undefined>
): ReduceState<PromiseResultSuccessValue<F>> {
  return function setData(fun) {
    updateData((old) => {
      if (old?.type == "success") {
        return {
          ...old,
          value: typeof fun == "function" ? (fun as any)(old.value) : fun,
        };
      }
      return old;
    });
  };
}

/**
 * 内部状态似乎不应该允许修改
 * 后面可以使用memo合并差异项
 * @param param0 
 * @param deps 
 * @returns [生效的数据,是否在loading]
 */
export function useBaseMemoPromiseState<T, Deps extends readonly any[]>(
  onFinally: undefined | OnFinally<T>,
  effect: (deps: Deps, ...vs: any[]) => OutPromiseOrFalse<T>,
  deps: Deps
) {
  const [data, updateData] = useState<GetPromiseResult<T>>()
  const hasPromise = useMemoPromiseCall((data) => {
    onFinally?.(data)
    updateData(data)
  }, effect, deps)
  const outData = hasPromise ? data : undefined
  return {
    data: outData,
    loading: outData?.getPromise != hasPromise,
    getPromise: hasPromise,
    setData: buildPromiseResultSetData(updateData),
  }
}
export function useMemoPromiseState<T, Deps extends readonly any[]>(
  effect: (deps: Deps, ...vs: any[]) => OutPromiseOrFalse<T>,
  deps: Deps
) {
  return useBaseMemoPromiseState(undefined, effect, deps)
}
export function useBaseCallbackPromiseState<T, Deps extends readonly any[]>(
  onFinally: undefined | OnFinally<T>,
  effect: GetPromiseRequest<T>,
  deps: Deps
) {
  const [data, updateData] = useState<GetPromiseResult<T>>()
  const hasPromise = useCallbackPromiseCall((data) => {
    onFinally?.(data)
    updateData(data)
  }, effect, deps)
  return {
    data,
    loading: data?.getPromise != hasPromise,
    getPromise: hasPromise,
    setData: buildPromiseResultSetData(updateData),
  };
}

export function useCallbackPromiseState<T, Deps extends readonly any[]>(
  effect: GetPromiseRequest<T>,
  deps: Deps
) {
  return useBaseCallbackPromiseState(undefined, effect, deps)
}

export function useMutation<Req extends any[], Res>(effect: (...vs: Req) => Promise<Res>) {
  const boolLock = useRef(false)
  return function (...vs: Req) {
    if (boolLock.get()) {
      return
    }
    boolLock.set(true)
    return effect(...vs).finally(() => {
      boolLock.set(false)
    })
  }
}

export function useMutationWithLoading<Req extends any[], Res>(effect: (...vs: Req) => Promise<Res>) {
  const [loading, setLoading] = useState(false)
  const request = useMutation(effect)
  return [function (...vs: Req) {
    const out = request(...vs)
    if (out) {
      setLoading(true)
      return out.finally(() => {
        setLoading(false)
      })
    }
  }, loading] as const
}

export type VersionPromiseResult<T> = PromiseResult<T> & {
  version: number
}
/**
 * 因为要访问UI上的状态来阻塞,所以useEvent来锁定
 * @param effect 
 * @returns 
 */
export function useMutationState<Req extends any[], Res>(effect: (...vs: Req) => Promise<Res>) {
  const [getVersion, updateVersion] = useVersionLock(0)
  const [data, updateData] = useChange<VersionPromiseResult<Res>>()
  return [useEvent(function (...vs: Req) {
    if ((data?.version || 0) != getVersion()) {
      return
    }
    const version = updateVersion()
    effect(...vs).then(res => {
      updateData({ type: "success", value: res, version })
    }).catch(err => {
      updateData({ type: "error", value: err, version })
    })
  }), data] as const
}
/**
 * 串行的请求,跟usePromise有相似之处,在于使用version
 * 也可以cancel
 * @param callback 
 * @param effect 
 * @returns 
 */
export function useSerialRequest<Req extends any[], Res>(
  callback: (vs: Req, version: number, signal?: AbortSignal) => Promise<Res>,
  effect: (res: VersionPromiseResult<Res>, version: number) => void
) {
  const lastCancelRef = useRef<EmptyFun | undefined>(undefined)
  const [versionLock, updateVersion] = useVersionLock();
  return [function (...vs: Req) {
    const version = updateVersion();
    callback(vs, version, createAndFlushAbortController(lastCancelRef))
      .then((data) => {
        if (version == versionLock()) {
          effect({
            type: "success",
            value: data,
            version
          }, version);
        }
      })
      .catch((err) => {
        if (version == versionLock()) {
          effect({
            type: "error",
            value: err,
            version
          }, version);
        }
      });
  }, updateVersion()] as const
}
/**
 * 可重载的异步请求,封闭一个loading
 * @param callback 
 * @param effect 
 * @returns 
 */
export function useSerialRequestLoading<Req extends any[], Res>(
  callback: (vs: Req, signal?: AbortSignal) => Promise<Res>,
  effect: (res: VersionPromiseResult<Res>) => void
) {
  const [reqVersion, setReqVersion] = useState(0);
  const [resVersion, setResVersion] = useState(0);
  const [request, updateVersion] = useSerialRequest(
    function (args: Req, v, signal) {
      setReqVersion(v);
      return callback(args, signal);
    },
    function (res, v) {
      setResVersion(v);
      return effect(res);
    }
  );
  return [request, reqVersion != resVersion, updateVersion] as const;
}

export function buildRefreshPromise<T>(shouldNotify: (a: T, old: T) => boolean) {
  return function useRefreshPromise(getPromise: T) {
    const refreshFlag = useRef<{
      getPromise: T;
      notify(): void;
    } | undefined>(undefined);
    return {
      request: useEvent(function (updateVersion: () => void) {
        return new Promise((resolve) => {
          updateVersion();
          refreshFlag.set({
            getPromise,
            notify() {
              refreshFlag.set(undefined)
              resolve(null);
            },
          })
        });
      }),
      notify(getPromise: T) {
        const rf = refreshFlag.get()
        if (rf) {
          if (shouldNotify(getPromise, rf.getPromise)) {
            rf.notify();
          }
        }
      },
    };
  }
}
/**
 * 将上面的usePromise转换成promise
 * @param getPromise
 * @returns
 */
export const useRefreshPromise = buildRefreshPromise<GetPromise<any>>(function (a, old) {
  return a.version > old.version
})
/**
 * 如果是仅用数字的VersionPromiseResult
 */
export const useVersionRefreshPromise = buildRefreshPromise<number>(function (a, b) {
  return a > b
})