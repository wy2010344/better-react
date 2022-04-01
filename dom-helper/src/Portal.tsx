import { useEffect } from 'better-react';
import { useRef, useOnlyId } from 'better-react-helper';
import { Portal as BasePortal } from 'better-react';
import { FiberNode, React } from 'better-react-dom';
/**
 * Creates DOM element to be used as React root.
 */
function createRootElement(id: string) {
  const rootContainer = document.createElement('div');
  rootContainer.setAttribute('id', id);
  return rootContainer;
}

/**
 * Hook to create a React Portal.
 * Automatically handles creating and tearing-down the root elements (no SRR
 * makes this trivial), so there is no need to ensure the parent target already
 * exists.
 * @example
 * const target = usePortal(id, [id]);
 * return createPortal(children, target);
 * @param  id The id of the target container, e.g 'modal' or 'spotlight'
 * @returns The DOM node to use as the Portal target.
 */
function usePortal(id: string, appendElement: (v: Element) => void) {
  const rootElemRef = useRef<HTMLElement | null>(null);
  useEffect(function () {
    // Look for existing target dom element to append to
    const existingParent = document.querySelector(`#${id}`);
    // Parent is either a new root or the existing dom element
    const parentElem = existingParent || createRootElement(id);

    // If there is no existing DOM element, add a new one.
    if (!existingParent) {
      appendElement(parentElem);
    }
    // Add the detached element to the parent
    const element = rootElemRef()
    if (element) {
      parentElem.appendChild(element)
    } else {
      console.warn('no parent found')
    }
    return function removeElement() {
      rootElemRef()?.remove();
      if (!parentElem.childElementCount) {
        parentElem.remove();
      }
    };
  }, [id])
  /**
   * It's important we evaluate this lazily:
   * - We need first render to contain the DOM element, so it shouldn't happen
   *   in useEffect. We would normally put this in the constructor().
   * - We can't do 'const rootElemRef = useRef(document.createElement('div))',
   *   since this will run every single render (that's a lot).
   * - We want the ref to consistently point to the same DOM element and only
   *   ever run once.
   * @link https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
   */
  function getRootElem() {
    const element = rootElemRef()
    if (!element) {
      rootElemRef(document.createElement('div'))
    }
    return rootElemRef() as HTMLDivElement
  }
  return getRootElem();
}

export function Portal({
  getParent,
  children
}: {
  getParent(): HTMLElement | undefined | null
  children: React.ReactNode
}) {
  const { id } = useOnlyId("portal")
  const target = usePortal(id, function (v) {
    const parent = getParent()
    if (parent) {
      parent.appendChild(v)
    } else {
      console.error(`can't find parent id`)
    }
  })
  return <BasePortal children={children} node={FiberNode.create(target)} />
}

function getDocument() {
  return document.body
}
export function RootPortal({
  children
}: {
  children: React.ReactNode
}) {
  return <Portal getParent={getDocument} children={children} />
}
export function IdPortal({
  id: parentId,
  children
}: {
  id: string
  children: React.ReactNode
}) {
  return <Portal getParent={() => document.getElementById(parentId)} children={children} />
}