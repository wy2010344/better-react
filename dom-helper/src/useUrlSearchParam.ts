import { useChange } from "better-react-helper";

/**
 * 在next.js要使用next的router
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
        history.pushState(null, "", url as any)
      } else {
        history.replaceState(null, "", url as any);
      }
    },
  ] as const;
}