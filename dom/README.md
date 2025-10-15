# better-react-dom

DOM renderer for better-react framework.

## Installation

```bash
npm install better-react-dom
# or
pnpm add better-react-dom
```

## Peer Dependencies

- `better-react` (workspace dependency)
- `better-react-helper` (workspace dependency)
- `wy-dom-helper` (workspace dependency)
- `wy-helper` (workspace dependency)

## Features

- **DOM Rendering** - Efficient DOM rendering engine
- **Portal Support** - Portal rendering capabilities
- **Event Handling** - Optimized event management
- **Server-Side Rendering** - SSR support

## Usage

```ts
import { createRoot, dom, fdom } from 'better-react-dom'

// Create root
const destroy = createRoot(document.getElementById('app')!, () => {
  // Your app components
})

// Use DOM elements
dom.div({
  className: 'container',
  children: 'Hello World',
})

// Use functional DOM (fdom)
fdom.button({
  onClick: () => console.log('clicked'),
  childrenType: 'text',
  children: 'Click me',
})
```

## Development

See the [main README](../README.md) for development setup instructions.
