import { createContext } from "better-react";
import { useEffect, useMemo, useRef, useState } from "better-react-helper";
import { Action, createBrowserHistory, Update } from "history";
import { ReadURLSearchParam } from "wy-dom-helper";
import { emptyArray } from "wy-helper";

export const history = createBrowserHistory();

const HistoryContext = createContext<{
  pathname: string;
  action: Action;
  hash: string;
  search: ReadURLSearchParam;
  beforeHref: string;
}>(undefined as any);
export function useLocation() {
  const ctx = HistoryContext.useConsumer();
  if (ctx) {
    return ctx;
  }

  const beforeHref = useRef<string | undefined>(undefined);
  const [state, setState] = useState<Update>(history);

  useEffect(() => {
    let cacheHref = location.href;
    return history.listen((value) => {
      beforeHref.current = cacheHref;
      cacheHref = location.href;
      setState(value);
    });
  }, emptyArray);

  return useMemo(() => {
    let pathname = decodeURI(state.location.pathname);
    if (pathname.startsWith("/")) {
      pathname = pathname.slice(1);
    }

    return {
      beforeHref: beforeHref.current,
      pathname,
      action: state.action,
      hash: state.location.hash,
      search: new URLSearchParams(state.location.search) as ReadURLSearchParam,
    };
  }, [state]);
}
