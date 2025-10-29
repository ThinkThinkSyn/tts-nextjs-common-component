# @thinkthinksyn/nextjs-common-component

Common Next.js components for sharing across repositories. Supports Next.js 14 and 15.

## Installation

```bash
npm install @thinkthinksyn/nextjs-common-component
```

## Peer Dependencies

Make sure you have these installed in your project:

```bash
npm install react react-dom next framer-motion lucide-react
```

## Components

### FloatingChatWidget

A floating chat widget component that can be easily integrated into any Next.js application.

#### Basic Usage

```tsx
import { FloatingChatWidget } from '@thinkthinksyn/nextjs-common-component'

function App() {
  const handleSubmit = async (content: string) => {
    // Handle message submission
    console.log('Message:', content)
  }

  const handleClear = () => {
    // Handle conversation clear
    console.log('Conversation cleared')
  }

  return (
    <FloatingChatWidget
      title="Chat Assistant"
      placeholder="Type your message..."
      onSubmit={handleSubmit}
      onClear={handleClear}
    />
  )
}
```

#### Controlled Usage

```tsx
import { FloatingChatWidget, IChatMessage } from '@thinkthinksyn/nextjs-common-component'
import { useState } from 'react'

function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<IChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (content: string) => {
    const userMessage: IChatMessage = {
      role: 'user',
      content,
      createdAt: Date.now()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      const assistantMessage: IChatMessage = {
        role: 'assistant',
        content: 'This is a response',
        createdAt: Date.now()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleClear = () => {
    setMessages([])
  }

  return (
    <FloatingChatWidget
      isOpen={isOpen}
      onToggle={setIsOpen}
      messages={messages}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onClear={handleClear}
    />
  )
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `"Chat Assistant"` | Title displayed in the chat header |
| `placeholder` | `string` | `"Type a message..."` | Input placeholder text |
| `maxLength` | `number` | `500` | Maximum message length |
| `showFileUpload` | `boolean` | `false` | Whether to show file upload (not implemented yet) |
| `className` | `string` | `""` | Additional CSS classes for the chat bubble |
| `onSubmit` | `(content: string, attachments?: IChatMedia[]) => Promise<void>` | **Required** | Callback when user submits a message |
| `onClear` | `() => void` | `undefined` | Callback when user clears conversation (optional) |
| `isOpen` | `boolean` | `undefined` | Controlled state for chat visibility |
| `onToggle` | `(open: boolean) => void` | `undefined` | Callback for controlling chat visibility |
| `messages` | `IChatMessage[]` | `[]` | Array of chat messages |
| `isLoading` | `boolean` | `false` | Whether the chat is in loading state |

## Types

### IChatMessage

```tsx
interface IChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
  medias?: Record<number, IChatMedia>
}
```

### IChatMedia

```tsx
interface IChatMedia {
  type: 'audio' | 'image' | 'file'
  content?: string
  data?: string
  name?: string
  size?: number
}
```

## Styling

The component uses Tailwind CSS classes. Make sure your project has Tailwind CSS configured with the following CSS variables in your global styles:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
}
```

## License

MIT