import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { genTemplateStringS1 } from "wy-helper"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**减少twMerge */
export function tw(strings: TemplateStringsArray, ...vs: string[]) {
  return genTemplateStringS1(strings, vs)
}