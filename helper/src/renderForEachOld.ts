import { renderForEach } from 'better-react'
import {
  IStateHolder,
  normalMapCreater,
  RMapCreater,
} from 'wy-helper/state-function'

/**
 * @deprecated 显然不再适合，直接使用renderForEach
 * @param forEach
 * @param createMap
 * @returns
 */
export function renderForEachOld<K, Z = void, M = void>(
  forEach: (callback: (key: K, render: (v: K) => Z) => Z) => M,
  createMap: RMapCreater<K, IStateHolder[]> = normalMapCreater,
) {
  const callback = renderForEach<K, Z>(createMap)
  return forEach(callback)
}
