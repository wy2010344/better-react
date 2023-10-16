import { createContext } from "better-react";

const errorContext = createContext<string[]>([])


export function useErrorContextProvide(errors: string[]) {
  const list = errorContext.useConsumer()
  const allErrors = list.concat(errors)
  errorContext.useProvider(allErrors)
  return allErrors
}