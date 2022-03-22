import { RouteFun } from '.'
import Better from '../better-react'
import PanelReact from '../drag/PanelReact'


const prolog: RouteFun<void> = ({ close, moveToFirst }) => {
  return (
    <PanelReact
      moveFirst={moveToFirst}
      close={close}
      title="prolog 测试"
    >{x => {

      return <div></div>
    }}</PanelReact>
  )
}
export default prolog