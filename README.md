# @thinkthinksyn/nextjs-component

Common Next.js utilities, hooks, stores, and types for sharing across repositories. Supports Next.js 14 and 15.

## Installation

```bash
npm install @thinkthinksyn/nextjs-component
```

## Peer Dependencies

Make sure you have these installed in your project:

```bash
npm install react react-dom
```

## What's Included

This package provides a collection of utilities, hooks, stores, and TypeScript types for Next.js applications:

- **Hooks**: Custom React hooks for common functionality
- **Stores**: Zustand stores for state management
- **Types**: TypeScript type definitions for chat and other features
- **Utils**: Utility functions and i18n support

## Hooks

### useCopyToClipboard

A hook for copying text to clipboard with feedback.

```tsx
import { useCopyToClipboard } from "@thinkthinksyn/nextjs-component"

function MyComponent() {
  const { copyToClipboard, isCopied } = useCopyToClipboard()

  return (
    <button onClick={() => copyToClipboard("Hello World")}>
      {isCopied ? "Copied!" : "Copy"}
    </button>
  )
}
```

### useHotkeys

A hook for handling keyboard shortcuts.

### useScrollToBottom

A hook for automatically scrolling to the bottom of a container.

### useSpeechSettings

A hook for managing speech synthesis settings.

## Stores

### Chat Stores

Zustand stores for managing chat functionality:

- `useChatStore`: Main chat state management
- `useChatInputStore`: Chat input state management
- `useFloatingChatStore`: Floating chat widget state management

```tsx
import { useChatStore } from "@thinkthinksyn/nextjs-component"

function ChatComponent() {
  const { messages, addMessage, clearMessages } = useChatStore()

  // Use the store...
}
```

## Types

### Chat Types

```tsx
import type {
  IChatMessage,
  IChatMedia,
  ChatRole,
  DbConversation,
} from "@thinkthinksyn/nextjs-component"

// IChatMessage interface
interface IChatMessage {
  id?: string
  role: ChatRole // 'user' | 'assistant' | 'system' | 'lawyer'
  content: string
  createdAt: number
  medias?: Record<number, IChatMedia>
  parts?: Array<ChatMessagePart>
}

// IChatMedia interface
interface IChatMedia {
  type: "image" | "video" | "audio" | "file"
  content?: string | Blob
  data: string | Blob
}
```

## Utilities

### General Utils

```tsx
import {
  getUtcTimestampInSeconds,
  throttle,
  objectPick,
  objectOmit,
} from "@thinkthinksyn/nextjs-component"

// Get current UTC timestamp in seconds
const timestamp = getUtcTimestampInSeconds()

// Throttle function calls
const throttledFn = throttle(() => console.log("Called"), 1000)

// Pick specific properties from object
const picked = objectPick({ a: 1, b: 2, c: 3 }, "a", "b") // { a: 1, b: 2 }

// Omit specific properties from object
const omitted = objectOmit({ a: 1, b: 2, c: 3 }, "c") // { a: 1, b: 2 }
```

### Chat Utils

Utilities for chat functionality including message processing and formatting.

### File Utils

Utilities for file handling and processing.

### Speech Utils

Utilities for speech synthesis and recognition.

### Storage Utils

Utilities for browser storage management.

### i18n Utils

Internationalization utilities with client and server-side support.

```tsx
import { useTranslation } from "@thinkthinksyn/nextjs-component"

// Client-side usage
function MyComponent() {
  const { t } = useTranslation()
  return <div>{t("hello")}</div>
}
```

## Dependencies

This package includes the following dependencies:

- `zustand`: State management
- `immer`: Immutable state updates
- `lucide-react`: Icons
- `tailwind-merge`: Tailwind CSS class merging
- `react-i18next`: Internationalization
- `idb-keyval`: IndexedDB wrapper
- And more...

## License

MIT
