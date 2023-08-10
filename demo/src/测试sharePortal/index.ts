import { domOf, useDom } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";
import { renderIf, useSharePortal, useVersion } from 'better-react-helper'
import { useEffect } from "better-react";
export default function () {

  const { render, useAppend } = useSharePortal()

  render()

  useAppend(function () {
    const version = renderCount()

    renderIf(version % 3 == 0, function () {
      useAppend(function () {
        renderCount()
      })
    })
  })
}

function renderCount() {

  const [version, updateVersion] = useVersion()

  useEffect(() => {
    console.log("初始化" + version)
    return () => {
      console.log("销毁" + version)
    }
  }, [])
  domOf("button", {
    onClick() {
      updateVersion()
    }
  }).renderTextContent("点击" + version)
  return version
}