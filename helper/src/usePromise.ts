
import { useEvent } from "./useEvent"
import { useChange, useState } from "./useState"
import { useMemo, useAtomBind, useAtom, useRefConst } from "./useRef"
import { } from "better-react"
import { useVersionInc, useVersionLock } from "./Lock"
import { useEffect } from "./useEffect"
import { createEmptyArray, ReduceState, EmptyFun, emptyFun, StoreRef, PromiseResult, buildSerialRequestSingle, VersionPromiseResult, OutPromiseOrFalse, GetPromiseRequest, OnVersionPromiseFinally, PromiseResultSuccessValue, createAbortController, buildPromiseResultSetData } from "wy-helper"

export function createAndFlushAbortController(ref: StoreRef<EmptyFun | undefined>) {
  const controller = createAbortController()
  const last = ref.get()
  if (last) {
    last()
  }
  ref.set(controller.cancel)
  return controller.signal
}

export function useMemoPromiseCall<T, Deps extends readonly any[]>(
  initOnFinally: OnVersionPromiseFinally<T>,
  effect: (deps: Deps, ...vs: any[]) => OutPromiseOrFalse<T>,
  deps: Deps
) {
  const inc = useVersionInc()
  const mout = useMemo(() => {
    return {
      version: inc(),
      request: effect(deps)
    }
  }, deps)
  const {
    version,
    request
  } = mout
  const onFinally = useEvent(function (data: VersionPromiseResult<T>) {
    if (version == data.version) {
      initOnFinally(data)
    }
  })
  useEffect(() => {
    if (request) {
      const signal = createAbortController();
      request(signal.signal).then(data => {
        onFinally({ type: "success", value: data, version })
      }).catch(err => {
        onFinally({ type: "error", value: err, version })
      })
      return signal.cancel
    }
  }, [version, request, onFinally])
  return mout
}
export function useCallbackPromiseCall<T, Deps extends readonly any[]>(
  onFinally: OnVersionPromiseFinally<T>,
  request: GetPromiseRequest<T>,
  deps: Deps
) {
  return useMemoPromiseCall(onFinally, () => request, deps)
}
/**
 * 内部状态似乎不应该允许修改
 * 后面可以使用memo合并差异项
 * @param param0 
 * @param deps 
 * @returns [生效的数据,是否在loading]
 */
export function useBaseMemoPromiseState<T, Deps extends readonly any[]>(
  onFinally: undefined | OnVersionPromiseFinally<T>,
  effect: (deps: Deps, ...vs: any[]) => OutPromiseOrFalse<T>,
  deps: Deps
) {
  const [data, updateData] = useState<VersionPromiseResult<T>>()
  const { version, request } = useMemoPromiseCall((data) => {
    onFinally?.(data)
    updateData(data)
  }, effect, deps)
  const outData = request ? data : undefined
  return {
    data: outData,
    version,
    loading: outData?.version != version,
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
  onFinally: undefined | OnVersionPromiseFinally<T>,
  effect: GetPromiseRequest<T>,
  deps: Deps
) {
  return useBaseMemoPromiseState(onFinally, () => effect, deps)
}

export function useCallbackPromiseState<T, Deps extends readonly any[]>(
  effect: GetPromiseRequest<T>,
  deps: Deps
) {
  return useBaseCallbackPromiseState(undefined, effect, deps)
}

export function useMutation<Req extends any[], Res>(effect: (...vs: Req) => Promise<Res>) {
  const boolLock = useAtomBind(false)
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

export function useSerialRequestSingle<Req extends any[], Res>(
  callback: (...vs: Req) => Promise<Res>,
  effect: (res: PromiseResult<Res>) => void = emptyFun
) {
  const cacheList = useRefConst<Req[]>(createEmptyArray)
  return buildSerialRequestSingle(callback, effect, cacheList)
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
  const lastCancelRef = useAtomBind<EmptyFun | undefined>(undefined)
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
    const refreshFlag = useAtom<{
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
 * 如果是仅用数字的VersionPromiseResult
 */
export const useVersionRefreshPromise = buildRefreshPromise<number>(function (a, b) {
  return a > b
})