import { EmptyFun, emptyArray, renderMapF, useEffect } from "better-react";
import { ValueCenter, useStoreTriggerRender, useValueCenter } from "./ValueCenter";
import { renderFragment } from "./renderFragment";
import { defaultTranslate, renderMap } from "./renderMap";



export type SharePortalModel = ValueCenter<EmptyFun>[];
export function renderSharePortal(store: ValueCenter<SharePortalModel>) {
  // console.log("--顶层改变--")
  return renderFragment(function () {
    const list = useStoreTriggerRender(store)
    // console.log("--list改变--")
    renderMapF(undefined, list, defaultTranslate, function (row: ValueCenter<EmptyFun>, i) {
      return [row, undefined, function () {
        const value = useStoreTriggerRender(row)
        // console.log("--内容改变--")
        return value()
      }, [row]]
    }, [list])
  }, [store])
}

export function useCreateSharePortal() {
  const list = useValueCenter<SharePortalModel>(emptyArray as SharePortalModel);
  return {
    list,
    append(value: ValueCenter<EmptyFun>) {
      const oldList = list.get().filter((v) => v != value);
      list.set(oldList.concat(value));
      return function () {
        list.set(list.get().filter((v) => v != value));
      }
    }
  };
}

export type SharePortalOperate = ReturnType<typeof useCreateSharePortal>["append"];
export function useAlawaysCenter(value: EmptyFun, deps?: readonly any[]) {
  const store = useValueCenter(value);
  useEffect(() => {
    store.set(value);
  }, deps);
  return store;
}

export function useAppendSharePop(
  store: SharePortalOperate,
  value: EmptyFun,
  deps?: readonly any[]
) {
  const rightPanel = useAlawaysCenter(value, deps);
  useEffect(() => {
    return store(rightPanel)
  }, emptyArray);
}


export function useSharePortal() {
  const { list, append } = useCreateSharePortal()

  return {
    render() {
      renderSharePortal(list)
    },
    useAppend(value: EmptyFun, deps?: readonly any[]) {
      useAppendSharePop(append, value, deps)
    },
  }
}