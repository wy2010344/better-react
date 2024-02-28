import { TranslaterPoint } from "../Translater"
import { Direction } from "./enums"

type Position = {
  x: number
  y: number
}
export const isValidPostion = (
  startPoint: TranslaterPoint,
  endPoint: TranslaterPoint,
  currentPos: Position,
  prePos: Position
) => {
  const computeDirection = (endValue: number, startValue: number) => {
    const delta = endValue - startValue
    const direction =
      delta > 0
        ? Direction.Negative
        : delta < 0
          ? Direction.Positive
          : Direction.Default
    return direction
  }
  const directionX = computeDirection(endPoint.x, startPoint.x)
  const directionY = computeDirection(endPoint.y, startPoint.y)
  const deltaX = currentPos.x - prePos.x
  const deltaY = currentPos.y - prePos.y

  return directionX * deltaX <= 0 && directionY * deltaY <= 0
}