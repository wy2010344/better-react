import { GetPromiseRequest, PromiseResult, createAndFlushAbortController } from "./usePromise"
import { useStoreTriggerRender } from "./useStoreTriggerRender"
import { EmptyFun, quote, storeRef, valueCenterOf } from "wy-helper"

/**
 * 这里是如果重新请求,则放弃
 * 是否可以禁止重复请求?
 * @param getResource 
 * @returns 
 */
export function createResource<T>(getResource: GetPromiseRequest<T>) {
  const resource = valueCenterOf<PromiseResult<T> | undefined>(undefined)
  let promise: Promise<any> | undefined = undefined
  const cancelRef = storeRef<EmptyFun | undefined>(undefined)
  function reloadPromise() {
    const thePromise = getResource(createAndFlushAbortController(cancelRef)).then(value => {
      if (thePromise == promise) {
        resource.set({
          type: "success",
          value
        })
      }
    }).catch(err => {
      if (thePromise == promise) {
        resource.set({
          type: "error",
          value: err
        })
      }
    })
    promise = thePromise
  }
  function useFilter<M>(filter: (v?: PromiseResult<T>) => M) {
    return useStoreTriggerRender(resource, {
      filter,
      onBind(a) {
        if (!promise) {
          reloadPromise()
        }
      },
    })
  }
  return {
    useFilter,
    useAsState() {
      return useFilter(quote)
    },
    invalid() {
      resource.set(undefined)
      promise = undefined
      if (resource.poolSize()) {
        reloadPromise()
      }
    }
  }
}