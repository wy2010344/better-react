type uinteger = number;
interface Position {
  line: uinteger;
  character: uinteger;
}

export interface Range {
  start: Position;
  end: Position;
}



type VSCodeDefineTokenEnum = {
  "namespace": 0,
  "type": 1,
  "class": 2,
  "enum": 3,
  "interface": 4,
  "struct": 5,
  "typeParameter": 6,
  "parameter": 7,
  "variable": 8,
  "property": 9,
  "enumMember": 10,
  "event": 11,
  "function": 12,
  "method": 13,
  "macro": 14,
  "keyword": 15,
  "modifier": 16,
  "comment": 17,
  "string": 18,
  "number": 19,
  "regexp": 20,
  "operator": 21
}

export type VSCodeDefineType = keyof VSCodeDefineTokenEnum

export type VSToken = {
  vstype: VSCodeDefineType
  range: Range
  value: string
}