import { FragmentParam, useEffect, useRefValue, useValue } from 'better-react';
import { Portal as BasePortal } from 'better-react';
import { FiberNode, React } from 'better-react-dom';
import { createElement } from 'better-react-dom'


type PortalParams = FragmentParam & React.HTMLProps<HTMLDivElement>
export function Portal({
  getParent,
  children,
  ...props
}: PortalParams & {
  getParent(): HTMLElement | undefined | null
}) {
  const oldProps = useValue<React.HTMLProps<HTMLDivElement>>(() => props)
  const node = useRefValue(() => {
    const node = FiberNode.createFrom("div", props)
    node.init(props)
    return node
  })()
  useEffect(function () {
    node.update(
      props,
      oldProps()
    )
    oldProps(props)
  })
  useEffect(function () {
    const parent = getParent()
    if (parent) {
      parent.appendChild(node.node)
    } else {
      console.error(`can't find parent id`)
    }
    return function () {
      const props = oldProps()
      node.removeFromParent(props)
      node.destroy(props)
    }
  }, [])

  return <BasePortal children={children} node={node} />
}

function getDocument() {
  return document.body
}
export function RootPortal(params: PortalParams) {
  return <Portal getParent={getDocument} {...params} />
}
export function IdPortal({
  id,
  ...params
}: PortalParams & { id: string }) {
  return <Portal getParent={() => document.getElementById(id)} {...params} />
}