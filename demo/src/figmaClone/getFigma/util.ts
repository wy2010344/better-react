import { env } from "process"






const TOKEN = 'figd_zok_5q6GvsfE1yZYipklsmGITaj_R-2BXsZJ3AiN'
export function figmaFetch(url: string) {
  if (env['HOME']) {
    url = `https://api.figma.com` + url.slice(6)
  }
  return fetch(url, {
    headers: {
      'X-Figma-Token': TOKEN,
    },
  })
}