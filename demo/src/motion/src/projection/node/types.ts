import { Box } from "wy-helper"



export interface AxisDelta {
  translate: number
  scale: number
  origin: number
  originPoint: number
}

export interface Delta {
  x: AxisDelta
  y: AxisDelta
}


export interface ResolvedValues {
  [key: string]: string | number
}

export interface Measurements {
  animationId: number
  measuredBox: Box
  layoutBox: Box
  latestValues: ResolvedValues
  source: number
}

export interface LayoutUpdateData {
  layout: Box
  snapshot: Measurements
  delta: Delta
  layoutDelta: Delta
  hasLayoutChanged: boolean
  hasRelativeTargetChanged: boolean
}