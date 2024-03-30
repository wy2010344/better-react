import { faker } from "@faker-js/faker";
import { dom } from "better-react-dom";
import { createUseReducer, renderArray, useVersion } from "better-react-helper";
import { version } from "d3";
import { arrayToMove } from "wy-helper";

export default function () {
  dom.div({
    style: `
  width:100px;
  height:100px;
 background:red; 
  `
  }).renderFragment(children)


  dom.div({
    style: `
    background:blue;
    padding:30px;
    `
  }).renderFragment(() => {

  })
}


function children() {

  const [version, updateVersion] = useVersion()
  dom.button({
    onClick: updateVersion
  }).renderText`+${version}`
}