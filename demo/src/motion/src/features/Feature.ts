import { VisualElement } from "../render/VisualElement"





export abstract class Feature<T extends any = any>{
  isMounted = false
  constructor(public node: VisualElement<T>) { }
  abstract mount(): void
  abstract unmount(): void
  update(): void { }
}