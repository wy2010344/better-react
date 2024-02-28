import { BoundingBox } from "wy-helper"





export interface DraggableProps {
  drag?: boolean | 'x' | 'y'

  dragDirectionLock?: boolean

  dragPropagation?: boolean

  dragConstraints?: false | Partial<BoundingBox> | (() => Element)

  dragListener?: boolean
}

export interface MotionProps extends
  DraggableProps {

}