import {
  hookEnvModel,
  MemoEvent,
  useBaseMemo,
  useLevelEffect,
} from 'better-react'
import {
  storeRef,
  quote,
  emptyArray,
  arrayNotEqualOrOne,
  GetValue,
  StoreRef,
} from 'wy-helper'
import { useAttrEffect } from './useEffect'
import {
  createUseBaseMemo,
  createUseMemoHelper,
  RenderStore,
} from 'wy-helper/state-function'

const helper = createUseMemoHelper(useBaseMemo)
const {
  useMemo,
  useConst,
  useConstFrom,
  useConstDep,
  useAtomBind,
  useAtomBindFun,
  useAtom,
  useAtomFun,
  useRef,
  useRefFrom,
  useLaterSetGet,
  useAlaways,
  useRefConstWith,
  useMemoVersion,
} = helper
export {
  useMemo,
  useConst,
  useConstFrom,
  useConstDep,
  useAtomBind,
  useAtomBindFun,
  useAtom,
  useAtomFun,
  useRef,
  useRefFrom,
  useLaterSetGet,
  useAlaways,
  useRefConstWith,
  useMemoVersion,
}
/**
 * 在AttrEffect里才生效,
 * 会用到吗
 * @param init
 * @returns
 */
export function useEventAlaways<T>(init: T) {
  const ref = useAtomBind(init)
  useAttrEffect(() => {
    ref.set(init)
  })
  return ref.get
}

type Ref<T> =
  | {
      current: T | null
    }
  | ((v: T | null) => void)

function setRef<T>(fu: Ref<T>, v: null | T) {
  if (typeof fu == 'function') {
    fu(v)
  } else {
    fu.current = v
  }
}
export function useImperativeHandle<T, D = any>(
  ref: Ref<T>,
  create: () => T,
  deps: D,
) {
  useLevelEffect(
    -Infinity,
    arrayNotEqualOrOne,
    () => {
      setRef(ref, create())
    },
    deps,
  )
  useLevelEffect(
    Infinity,
    arrayNotEqualOrOne,
    () => {
      return [
        null,
        () => {
          setRef(ref, null)
        },
      ]
    },
    deps,
  )
}
