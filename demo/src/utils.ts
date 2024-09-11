import { genTemplateString } from "better-react-dom"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**减少twMerge */
export function tw(strings: TemplateStringsArray, ...vs: string[]) {
  return genTemplateString(strings, vs)
}