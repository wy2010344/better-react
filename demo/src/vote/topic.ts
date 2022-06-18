import { useContent, useDom } from "better-react-dom";
import { TopicModel } from "../dbStore";
import { panelWith } from "../panel/PanelContext";




export default panelWith({
  children(operate, id, v: TopicModel) {
    useDom("div", {
      children() {
        useContent(v.description)
      }
    })
  }
})