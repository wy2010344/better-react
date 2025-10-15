# better-react-helper

Helper utilities and hooks for better-react framework.

## Installation

```bash
npm install better-react-helper
# or
pnpm add better-react-helper
```

## Peer Dependencies

- `better-react` (workspace dependency)
- `wy-helper` (workspace dependency)

## Features

### State Management

- `useReducer` - Enhanced reducer hook
- `useChange` - Simple state hook
- `useState` - State management hook

### Rendering Utilities

- `renderArray` - Array rendering helper
- `renderIf` - Conditional rendering
- `renderOne` - Single item rendering

### Effects

- `useEffect` - Effect hook
- `useOneEffect` - One-time effect
- `useAttrEffect` - Attribute effect
- `useHookEffect` - Hook effect

### Memoization

- `useMemo` - Memoization hook
- `useRef` - Reference hook

## Usage

```ts
import { useChange, renderArray, renderIf } from 'better-react-helper'

const [list, setList] = useState([])
renderArray(
  list,
  (item) => item.id,
  (item, index) => {
    // Render each item
  }
)
```

## Development

See the [main README](../README.md) for development setup instructions.
