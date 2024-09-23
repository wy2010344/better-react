import { dom } from "better-react-dom";
import { quote, SetValue } from "wy-helper";
import { replacePX } from "./copyToCss";



export default function (setPreText: SetValue<string>) {
  dom.button({
    className: "btn",
    async onClick() {
      const text = await navigator.clipboard.readText()
      const replaceText = mapToKV(text, (key, value) => {
        return toCamelCase(key) + ':' + '`' + replacePX(value) + '`'
      }).join(',\n')
      setPreText(replaceText)
    }
  }).renderText`复制成style`

  dom.button({
    className: "btn",
    async onClick() {
      const text = await navigator.clipboard.readText()
      const replaceText = mapToKV(text, (key, value) => {
        return 's.' + toCamelCase(key) + '=' + '`' + replacePX(value) + '`'
      }).join('\n')
      setPreText(replaceText)
    }
  }).renderText`复制成style-build`
}
function mapToKV(text: string, fun: (key: string, value: string) => string) {
  return text.split(';').map(row => {
    return row.trim()
  }).filter(quote).map(row => {
    let [key, value] = row.trim().split(':')
    key = key.trim()
    value = value.trim()
    return fun(key, value)
  })
}
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}
function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
}