import { useEffect, useMemo } from "better-react-helper";
import { useChange } from "better-react-helper";
import { MemoEvent } from "better-react";

function createMatch(e: MemoEvent<MediaQueryList, string>) {
  return window.matchMedia(e.trigger)
}
export function useMatchMedia(pattern: string) {
  const match = useMemo(createMatch, pattern)
  const [matchMedia, setMatchMedia] = useChange(match.matches);
  useEffect(() => {
    function heightChange(ev: MediaQueryListEvent) {
      setMatchMedia(ev.matches);
    }
    const match = window.matchMedia(pattern);
    setMatchMedia(match.matches);
    match.addEventListener("change", heightChange);
    return () => {
      match.removeEventListener("change", heightChange);
    }
  }, [pattern]);
  return matchMedia;
}