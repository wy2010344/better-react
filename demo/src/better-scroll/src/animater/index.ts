import Translater from "../Translater";
import { Options as BScrollOptions } from '../Options'
import Transition from "./Transition";
import Animation from "./Animation";
import Animater from './base'
export { Animater, Transition, Animation }


export default function createAnimater(
  element: HTMLElement,
  translater: Translater,
  options: BScrollOptions
) {

  const useTransition = options.useTransition

  let animaterOptions = {}
  Object.defineProperty(animaterOptions, 'probeType', {
    enumerable: true,
    configurable: false,
    get() {
      return options.probeType
    }
  })
  if (useTransition) {
    return new Transition(element, translater, animaterOptions as any)
  } else {
    return new Animation(element, translater, animaterOptions as any)
  }
}