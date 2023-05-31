import { useEffect } from "better-react";

export function useInit(callback: () => (void | (() => void))) {
  useEffect(callback, [])
}