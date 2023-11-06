import { emptyArray, useEffect } from "better-react"
import { React } from "better-react-dom"
import { useMemo } from "better-react-helper"



export function createScript(
  src: string
) {
  const script = document.createElement("script")
  script.src = src
  document.head.appendChild(script)
  return script
}

export function createLink(href: string) {
  const link = document.createElement("link")
  link.href = href
  link.rel = "stylesheet"
  document.head.appendChild(link)
  return link
}


/**如果是通过点击label过来的,最好附加在label内,否则会滚动到输入框 */
function createFileInput(id?: string) {
  const input = document.createElement("input");
  input.style.position = "absolute";
  input.style.left = "-1px";
  input.style.top = "-1px";
  input.style.width = "0px";
  input.style.height = "0px";
  input.setAttribute("type", "file");
  if (id) {
    input.id = id;
    const label = document.querySelector(`label[for=${id}]`);
    label?.appendChild(input);
  } else {
    document.body.appendChild(input);
  }
  return input;
}
export function chooseFileThen({
  accept,
  onChange,
}: {
  accept?: string;
  onChange(file: File): Promise<any>;
}) {
  const input = createFileInput();
  if (accept) {
    input.setAttribute("accept", accept);
  }
  input.addEventListener("change", async function (e) {
    const file = input.files?.[0];
    if (file) {
      await onChange(file);
    }
    input.remove();
  });
  input.click();
}

export function cns(...vs: (string | null | undefined)[]) {
  return vs.filter((v) => v).join(" ");
}


export function useGetUrl(file: File | Blob) {
  const url = useMemo(() => {
    return URL.createObjectURL(file);
  }, [file]);
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, emptyArray);
  return url;
}


export function delayAnimationFrame() {
  return new Promise(resolve => {
    requestAnimationFrame(resolve)
  })
}

export function stringifyStyle(style: React.CSSProperties) {
  const s = Object.entries(style).map(function (v) {
    return `${underlineToCamel(v[0])}:${v[1]};`
  }).join("")
  return s
}

export function underlineToCamel(str: string) {
  return str.replace(/\B([A-Z])/g, '-$1').toLowerCase()
}


import * as CSS from 'csstype';
export interface CSSProperties extends CSS.Properties<string | number> {
  /**
   * The index signature was removed to enable closed typing for style
   * using CSSType. You're able to use type assertion or module augmentation
   * to add properties or an index signature of your own.
   *
   * For examples and more information, visit:
   * https://github.com/frenic/csstype#what-should-i-do-when-i-get-type-errors
   */
}