import { EmptyFun, quote } from "wy-helper";
import { renderArray } from "./renderMap";


export function renderOne(key: any, render: EmptyFun) {
  renderArray([key], quote, render)
}