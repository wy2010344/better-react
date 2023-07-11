import { valueCenterOf } from "./ValueCenter"
import { GetPromise, PromiseResult } from "./usePromise"
import { useStoreTriggerRender } from "./ValueCenter"
import { quote } from "better-react"



export function createResource<T>(getResource: GetPromise<T>) {
  const resource = valueCenterOf<PromiseResult<T> | undefined>(undefined)
  let promise: Promise<any> | undefined = undefined
  function reloadPromise() {
    const thePromise = getResource().then(value => {
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