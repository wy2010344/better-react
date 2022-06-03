/// <reference types="vite/client" />
/// <reference types="better-react-dom/@types/tsxSupport"/>
declare const createElement: typeof import('better-react-dom')['createElement']
declare const Fragment: typeof import('better-react-dom')['Fragment']
// declare namespace JSX {
//   type IntrinsicElements = import("./better-react/tsxSupport").JSX.IntrinsicElements
//   type Element = import("./better-react/tsxSupport").JSX.Element
//   type ElementChildrenAttribute = import('./better-react/tsxSupport').JSX.ElementChildrenAttribute
// }