import sass from 'sass'

export function css(str: TemplateStringsArray, ...ps: any[]) {
  const vs = []
  let i = 0
  while (i < str.length) {
    vs.push(str)
    i++
    if (i < str.length) {
      vs.push(ps[i])
    }
  }
  console.log(vs)
  const result = sass.compileString(vs.join(""), {})

  return result.css
}