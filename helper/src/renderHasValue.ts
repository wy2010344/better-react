import { renderForEach } from "better-react";

export function renderMax(
  max: number,
  getKey: (i: number) => any,
  render: (i: number) => void
) {
  renderForEach(function (callback) {
    for (let i = 0; i < max; i++) {
      callback(getKey(i), () => {
        render(i)
      })
    }
  })
}
