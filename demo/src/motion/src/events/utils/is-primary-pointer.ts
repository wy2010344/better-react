export const isPrimaryPointer = (event: PointerEvent) => {
  if (event.pointerType === "mouse") {
    return typeof event.button !== "number" || event.button <= 0
  } else {
    /*** 
     * isPrimary 对于所有鼠标按钮都是 true，而每个触摸点
     * 被视为自己的输入。 因此后续并发接触点
     * 将是错误的。
     *
     * 此处专门与 false 匹配，作为不完整版本
     * 非常旧的浏览器中的 PointerEvents 可能会将其设置为未定义。
     */
    return event.isPrimary !== false
  }
}
