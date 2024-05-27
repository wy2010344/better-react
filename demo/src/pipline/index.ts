import { dom } from "better-react-dom";
import { usePipline } from "./usePipline";

export default function () {

  usePipline(() => {
    dom.div({
      style: `
  width:100px;
  height:100px;
  background:black;
  `
    }).render()
  }).useWrapInDom("div", {
    style: `
    position:relative;
    width:400px;
    height:400px;
    display:flex;
    align-items:center;
    justify-content:center;
    background:yellow;
    `
  }).useAppend(() => {
    dom.div({
      style: `
      background:green;
      width:100px;
      height:100px;
      `
    }).render()
  }).usePrepend(() => {
    dom.div({
      style: `
      width:100px;
      height:100px;
      background:blue;
      `
    }).render()
  }).useWrapInDom("div", {
    style: `
    height:100%;
    background:gray;
    display:flex;
    align-items:center;
    justify-content:center;
    `
  }).render()
}