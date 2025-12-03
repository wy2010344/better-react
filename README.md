# better-react

A better React framework with enhanced features and performance.

## Packages

- **better-react** - Core framework
- **better-react-helper** - Helper utilities and hooks
- **better-react-dom** - DOM renderer
- **better-react-dom-helper** - DOM-specific utilities

## Documentation

📖 Documentation: https://wy2010344.github.io/better-react (Work in progress)

## Getting Started

To start a better-react project, we recommend using [Vite](https://vite.dev/) with vanilla mode and TypeScript. You'll need these packages:

```bash
npm install wy-helper wy-dom-helper better-react better-react-helper better-react-dom better-react-dom-helper
```

> Note: `wy-helper` and `wy-dom-helper` are utility libraries with various features. See their documentation for details.

> better-react separates core and helper libraries into 4 packages for better modularity.

## Development

This project is part of a pseudo monorepo setup. To contribute:

1. Clone the pseudo monorepo:

   ```bash
   git clone https://github.com/wy2010344/es-pseudo-monorepo.git
   cd es-pseudo-monorepo
   ```

2. Clone this project into the packages directory:

   ```bash
   cd packages
   git clone https://github.com/wy2010344/better-react.git
   cd better-react
   ```

3. Install dependencies from the monorepo root:

   ```bash
   cd ../..
   pnpm install
   ```

4. Build and test:
   ```bash
   cd packages/better-react
   pnpm run build
   pnpm run lint:check
   pnpm run type-check
   ```

调整内容:

main.ts

```ts
import { createRoot, dom } from 'better-react-dom'
import { getScheduleAskTime } from 'wy-helper'
import { useChange } from 'better-react-helper'
const app = document.getElementById('app')!
const destroy = createRoot(
  app,
  () => {
    //你的业务代码应该放在这里
  },
  getScheduleAskTime()
)
window.addEventListener('unload', destroy)
```

## 一个简单的 count demo

```ts
const [count, setCount] = useChange(0)
dom.button({
  onClick() {
    setCount(count + 1)
  },
}).renderText`click time ${count}`
```

放在上面 main.ts 里备注的放业务代码的地方.

## 一个 todo demo

导入内容为:

```ts
import { fdom } from 'better-react-dom'
import { renderArray, useState } from 'better-react-helper'
import { emptyArray, quote } from 'wy-helper'
```

将下面的内容添加到上述业务代码位置.

```ts
const [list, setList] = useState(emptyArray as number[])
renderArray(list, quote, (row, i) => {
  fdom.div({
    children() {
      fdom.span({
        childrenType: 'text',
        children: `第${i + 1}行,内容是${row}`,
      })
      fdom.button({
        childrenType: 'text',
        children: '删除',
        onClick() {
          setList((list) => list.filter((item) => item != row))
        },
      })
    },
  })
})
fdom.button({
  childrenType: 'text',
  children: '添加',
  onClick() {
    setList((list) => list.concat(Date.now()))
  },
})
```

> fdom 是什么? https://github.com/wy2010344/better-react/wiki/fdom-fsvg-vs-dom-svg

## 一个完整的 todo

参考: https://todomvc.com/

https://github.com/wy2010344/better-react/blob/master/demo/src/complex-todo-demo.ts

## 源流

**_用于组件的迭代生成,或条件生成_**

- renderForEach (better-react)
  - renderArray (better-react-helper)
  - renderIf (better-react-helper)
  - rendeOne (better-react-helper)

**_保持不变_**

- useBaseMemo (better-react)
  - useMemo (better-react-helper)
  - useRef (better-react-helper)

**_状态_**

- useReducer (better-react-helper) 由 hookRequestReconcile 与 useMemo 组合
  - useChange (better-react-helper)
  - useState (better-react-helper)
  - ...

**_副作用_**

- hookEffect (better-react)
- useLevelEffect (better-react)
  - useEffect (better-react-helper)
  - useOneEffect (better-react-helper)
  - useAttrEffect (better-react-helper)
  - useHookEffect (better-react-helper)
  - ...

**_context_**

- createContext (better-react)

**_状态顺序_**

- flushSync (better-react)
- startTransition (better-react)

**_其它_**

- renderFiber (better-react)
  - renderFragment (better-react-helper) 一般用于生成局部的片段
- renderStateHolder (better-react) 最小的状态挂载,可能会用在 context 隔离
- renderPortal (better-react-dom)
