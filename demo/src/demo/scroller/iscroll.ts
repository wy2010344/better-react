import { faker } from "@faker-js/faker";
import { dom } from "better-react-dom";
import { renderArray, useEffect } from "better-react-helper";
import { emptyArray } from "wy-helper";
import IScroll from './lite'
import BScroll from "@better-scroll/core";
import { renderTemplate } from "./template";
export default function () {
  return renderTemplate(function (wrapper, getContainer) {

    useEffect(() => {
      new IScroll(wrapper, {
        useTransition: false
      })
    }, emptyArray)
  })
}