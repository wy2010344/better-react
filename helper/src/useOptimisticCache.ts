import { useOnlyId } from "./useOnlyId";
import { useChange } from "./useState";


/**
 * 
 * @param value 
 * @param deps 依赖项,发生了更新
 * @returns 
 */
export function useOptimisticCache<T>(value: T, deps: any = value) {
  const version = useOnlyId(deps)
  const [cache, setCache] = useChange<{
    version: number
    value: T
  }>()
  const isInCache = cache?.version == version
  return [
    isInCache ? cache!.value : value,
    (value: T) => {
      setCache({
        value,
        version
      })
    },
    isInCache
  ] as const
}