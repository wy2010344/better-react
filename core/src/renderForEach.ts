import { GetValue, StoreRef, alawaysFalse, storeRef } from 'wy-helper'
import { useBaseMemo } from './memo'
import { StateHolder } from './stateHolder'
import { hookEnvModel, hookStateHoder } from './cache'
import { createRenderForEach, MemoEvent } from 'wy-helper/state-function'

export const renderForEach = createRenderForEach(
  hookStateHoder,
  hookEnvModel,
  StateHolder.from,
  function <M>(createMap: GetValue<M>): StoreRef<M> {
    return useBaseMemo(alawaysFalse, createMapRef, createMap)
  },
)
function createMapRef<M>(e: MemoEvent<StoreRef<M>, GetValue<M>>) {
  return storeRef(e.trigger())
}
