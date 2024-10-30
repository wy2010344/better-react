
import { useState } from "./useState"
import { useAtom, useConstFrom } from "./useRef"
import { useVersionLock } from "./Lock"
import { createEmptyArray, emptyFun, PromiseResult, buildSerialRequestSingle, createAndFlushAbortController, VersionPromiseResult } from "wy-helper"

/**
 * 单线程提交
 * @param effect 
 * @returns 
 */
export function useMutation<Req extends any[], Res>(effect: (...vs: Req) => Promise<Res>) {
  const boolLock = useAtom(false)
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

export function useSerialRequestSingle<Req extends any[], Res>(
  callback: (...vs: Req) => Promise<Res>,
  effect: (res: PromiseResult<Res>) => void = emptyFun
) {
  const cacheList = useConstFrom<Req[]>(createEmptyArray)
  return buildSerialRequestSingle(callback, effect, cacheList)
}
/**
 * 串行的请求,跟usePromise有相似之处,在于使用version
 * 也可以cancel
 * @param callback 
 * @param effect 
 * @returns 
 */
export function useLatestRequest<Req extends any[], Res>(
  callback: (vs: Req, version: number, signal?: AbortSignal) => Promise<Res>,
  effect: (res: VersionPromiseResult<Res>, version: number) => void
) {
  const flushAbort = useConstFrom(createAndFlushAbortController)
  const [versionLock, updateVersion] = useVersionLock();
  return [function (...vs: Req) {
    const version = updateVersion();
    callback(vs, version, flushAbort())
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
  }, updateVersion] as const
}
/**
 * 可重载的异步请求,封闭一个loading
 * @param callback 
 * @param effect 
 * @returns 
 */
export function useLatestRequestLoading<Req extends any[], Res>(
  callback: (vs: Req, signal?: AbortSignal) => Promise<Res>,
  effect: (res: VersionPromiseResult<Res>) => void
) {
  const [reqVersion, setReqVersion] = useState(0);
  const [resVersion, setResVersion] = useState(0);
  const [request, updateVersion] = useLatestRequest(
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
      request(updateVersion: () => void) {
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
      },
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