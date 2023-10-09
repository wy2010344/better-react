import { useEffect } from "better-react"
import { useEvent } from "./useEvent"
import { useChange, useState } from "./useState"
import { useMemo, useRef } from "./useRef"
import { FalseType, emptyArray, storeRef } from "better-react/dist/util"
import { useVersionInc, useVersionLock } from "./Lock"
import { useCallback } from "./useCallback"
import { ReduceState } from "./ValueCenter"
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

export type GetPromise<T> = {
  request(...vs: any[]): Promise<T>
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
function doGetPromise<T>([getPromise, onFinally]: [GetPromise<T> | FalseType, (data: GetPromiseResult<T>) => void]) {
  if (getPromise) {
    getPromise.request().then(data => {
      onFinally({ type: "success", value: data, getPromise })
    }).catch(err => {
      onFinally({ type: "error", value: err, getPromise })
    })
  }
}

type OutPromiseOrFalse<T> = (() => Promise<T>) | FalseType;
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
  callback: (deps: Deps, ...vs: any[]) => Promise<T>,
  deps: Deps
) {
  const inc = useVersionInc()
  const getPromise = useMemo((dep) => {
    const version = inc()
    return {
      version,
      request() {
        return callback(dep)
      }
    }
  }, deps)
  usePromise(getPromise, onFinally)
  return getPromise
}
function buildSetData<T>(
  updateData: ReduceState<
    | (PromiseResult<T> & {
      getPromise: GetPromise<T>;
    })
    | undefined
  >
) {
  return function setData(fun: T | ((v: T) => T)) {
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
  const [data, updateData] = useState<PromiseResult<T> & {
    getPromise: GetPromise<T>
  }>()
  const hasPromise = useMemoPromiseCall((data) => {
    onFinally?.(data)
    updateData(data)
  }, effect, deps)
  const outData = hasPromise ? data : undefined
  return {
    data: outData,
    loading: outData?.getPromise != hasPromise,
    getPromise: hasPromise,
    setData: buildSetData(updateData),
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
  effect: (deps: Deps, ...vs: any[]) => Promise<T>,
  deps: Deps
) {
  const [data, updateData] = useState<PromiseResult<T> & {
    getPromise: GetPromise<T>
  }>()
  const hasPromise = useCallbackPromiseCall((data) => {
    onFinally?.(data)
    updateData(data)
  }, effect, deps)
  return {
    data,
    loading: data?.getPromise != hasPromise,
    getPromise: hasPromise,
    setData: buildSetData(updateData),
  };
}

export function useCallbackPromiseState<T, Deps extends readonly any[]>(
  effect: (deps: Deps, ...vs: any[]) => Promise<T>,
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

export type MutationState<T> = PromiseResult<T> & {
  version: number
}
export function useMutationState<Req extends any[], Res>(effect: (...vs: Req) => Promise<Res>) {
  const [getVersion, updateVersion] = useVersionLock(0)
  const [data, updateData] = useChange<MutationState<Res>>()
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
 * 串行的请求
 * @param callback 
 * @param effect 
 * @returns 
 */
export function useSerialRequest<Req extends any[], Res>(
  callback: (version: number, ...vs: Req) => Promise<Res>,
  effect: (version: number, res: PromiseResult<Res>) => void
) {
  const [versionLock, updateVersion] = useVersionLock();
  return [function (...vs: Req) {
    const version = updateVersion();
    callback(version, ...vs)
      .then((data) => {
        if (version == versionLock()) {
          effect(version, {
            type: "success",
            value: data,
          });
        }
      })
      .catch((err) => {
        if (version == versionLock()) {
          effect(version, {
            type: "error",
            value: err,
          });
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
  callback: (...vs: Req) => Promise<Res>,
  effect: (res: PromiseResult<Res>) => void
) {
  const [reqVersion, setReqVersion] = useState(0);
  const [resVersion, setResVersion] = useState(0);
  const [request, updateVersion] = useSerialRequest(
    function (v: number, ...args: Req) {
      setReqVersion(v);
      return callback(...args);
    },
    function (v, res) {
      setResVersion(v);
      return effect(res);
    }
  );
  return [request, reqVersion != resVersion, updateVersion] as const;
}
/**
 * 将上面的usePromise转换成promise
 * @param getPromise
 * @returns
 */
export function useRefreshPromise(getPromise: GetPromise<any>) {
  const refreshFlag = useRef<{
    getPromise: GetPromise<any>;
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
    notify(getPromise: GetPromise<any>) {
      const rf = refreshFlag.get()
      if (rf) {
        if (getPromise.version > rf.getPromise.version) {
          rf.notify();
        }
      }
    },
  };
}
