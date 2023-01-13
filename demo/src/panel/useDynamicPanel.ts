import { createContext, useEffect, useMemo } from "better-react";
import usePanel, { PanelParams } from "./usePanel";
import { ValueCenter, valueCenterOf } from "better-react-helper";

const PortalContext = createContext(valueCenterOf<{
  id: number
}[]>([]))

let globalID = 1
export function useDynamicPanel(args: Omit<PanelParams, 'moveFirst'>) {
  const panels = PortalContext.useConsumer();
  const thisId = useMemo(() => globalID++, []);
  useEffect(() => {
    const vs = panels.get();
    const idx = vs.findIndex(v => v.id == thisId);
    const thisRender = {
      id: thisId,
      callback() {
        usePanel({
          ...args,
          moveFirst() {
            const vs = panels.get();
            const idx = vs.findIndex(v => v.id == thisId);
            if (idx + 1 != vs.length) {
              const [old] = vs.splice(idx, 1);
              vs.push(old);
              panels.set([...vs]);
            }
          }
        });
      }
    };
    if (idx < 0) {
      //不存在,新增
      panels.set(vs.concat(thisRender));
    } else {
      //已经存在,修改
      vs.splice(idx, 1, thisRender);
      panels.set([...vs]);
    }
  });
  useEffect(() => {
    return () => {
      //最后一次,要删除
      const vs = panels.get();
      const idx = vs.findIndex(v => v.id == thisId);
      vs.splice(idx, 1);
      console.log("destroy", thisId, idx, vs);
      panels.set([...vs]);
    };
  }, []);
}
