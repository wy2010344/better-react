import { useFragment, useState } from "better-react-helper";
import { normalPanel } from "../panel/PanelContext";
import Counter from "./Counter";
import { useInput } from "better-react-dom-helper";
import { useFiber } from "better-react";

export default normalPanel(function () {


  Counter()
  console.log("外部render")
  useFragment(() => {
    console.log("内部render")


    const [value, setValue] = useState('');

    useInput("input", {
      value,
      onValueChange(v) {
        console.log("cc", v)
        if (canInputInt(v)) {
          console.log("setValue", v)
          setValue(v)
        }
      },
    })
  }, [])
})



export function canInputNumber(
  fix: number = 0,
  config?: {
    allowNegative?: boolean;
    canChange?(v: number): boolean;
  }
) {
  if (fix != Infinity) {
    if (fix < 0) {
      throw new Error("fix should be oppositive");
    }
    if (fix != Math.round(fix)) {
      throw new Error("fix should be int");
    }
  }
  return function (v: string) {
    if (v == "") {
      return true;
    } else if (v == "-") {
      //负数
      if (config?.allowNegative) {
        return true;
      } else {
        return false;
      }
    } else {
      const n = Number(v);
      if (isNaN(n)) {
        return false;
      }
      if (!config?.allowNegative && n < 0) {
        return false;
      }
      const idx = v.indexOf(".");
      if (idx > -1) {
        if (fix == 0) {
          return false;
        }
        if (v.length - idx - 1 > fix) {
          return false;
        }
      }
      if (config?.canChange) {
        return config.canChange(n);
      }
      return true;
    }
  };
}
export const canInputInt = canInputNumber();
export const canInputIntMax = canInputNumber(0, {
  canChange(v) {
    return v < 2147483647;
  },
});
export const canInputAnyPositiveNumber = canInputNumber(Infinity);
