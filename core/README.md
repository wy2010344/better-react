# better-react

Core framework for better-react - a better React framework with enhanced features and performance.

## Installation

```bash
npm install better-react
# or
pnpm add better-react
```

## Peer Dependencies

- `wy-helper` (workspace dependency)

## Usage

```ts
import { createRoot, dom } from 'better-react-dom'
import { getScheduleAskTime } from 'wy-helper'
import { useChange } from 'better-react-helper'

const app = document.getElementById('app')!
const destroy = createRoot(
  app,
  () => {
    // Your business code goes here
  },
  getScheduleAskTime()
)
window.addEventListener('unload', destroy)
```

## Simple Count Demo

```ts
const [count, setCount] = useChange(0)
dom.button({
  onClick() {
    setCount(count + 1)
  },
}).renderText`click time ${count}`
```

## Development

See the [main README](../README.md) for development setup instructions.
