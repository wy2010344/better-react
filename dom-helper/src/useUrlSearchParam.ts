import { useChange } from "better-react-helper";

/**
 * 在next.js要使用next的router,或直接操作query
 * @param key 
 * @param init 
 * @param save 
 * @returns 
 */
export function useUrlSearchParam<T>(
  key: string,
  init: (v: string | null) => T,
  save: (v: T) => string = (v) => v + ""
) {
  const [first, setfirst] = useChange(0, () => {
    let initKey: string | null = null;
    if (globalThis.location) {
      const url = new URL(globalThis.location.href);
      initKey = url.searchParams.get(key);
    }
    return init(initKey);
  });
  return [
    first,
    function (value: T, push?: boolean) {
      setfirst(value);
      const url = new URL(location.href);
      url.searchParams.set(key, save(value));
      if (push) {
        history.pushState(null, "", url)
      } else {
        history.replaceState(null, "", url);
      }
    },
  ] as const;
}

export function useUrlSearchParams() {
  const [first, setfirst] = useChange(0, () => {
    if (globalThis.location) {
      const url = new URL(globalThis.location.href);
      return url.searchParams
    }
    return new URLSearchParams()
  });
  return [
    first,
    function (actions: ({
      method: "append"
      key: string
      value: string
    } | {
      method: "delete"
      key: string
      value?: string
    } | {
      method: "set"
      key: string
      value: string
    })[], push?: boolean) {
      const url = new URL(location.href);
      actions.forEach(action => {
        url.searchParams[action.method](action.key, action.value as any)
      })
      setfirst(url.searchParams)
      if (push) {
        history.pushState(null, "", url)
      } else {
        history.replaceState(null, "", url);
      }
    }
  ] as const
}