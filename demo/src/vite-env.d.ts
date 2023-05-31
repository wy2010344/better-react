/// <reference types="vite/client" />

declare module "xml-reader" {
  export type XmlElement = {
    name: string; // element name (empty for text nodes)
    type: "element"; // node type (element or text), see NodeType constants
    parent: XmlNode; // reference to parent node (null with parentNodes option disabled or root node)
    attributes: { [name: string]: string }; // map of attributes name => value
    children: XmlNode[];
  }
  export type XmlNode = XmlElement | {
    type: "text"; // node type (element or text), see NodeType constants
    value: string; // value of a text node
    parent: XmlNode; // reference to parent node (null with parentNodes option disabled or root node)
  }
  export function create(): {
    on(type: string, callback: (v: XmlNode) => void): void
    parse(xml: string): void
  }
  export function parseSync(xml: string): XmlNode
}
