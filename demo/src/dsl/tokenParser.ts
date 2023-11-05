import { LineCharQue } from "@/kanren-logic"
import { Range } from "./vscode"
export function getRange(begin: LineCharQue, end: LineCharQue): Range {
  return {
    start: {
      line: begin.line,
      character: begin.character
    },
    end: {
      line: end.line,
      character: end.character
    }
  }
}

