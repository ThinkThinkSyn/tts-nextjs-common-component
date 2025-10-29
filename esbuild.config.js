import { build } from 'esbuild'

const external = [
  'react',
  'react-dom', 
  'next',
  '@radix-ui/*',
  'framer-motion',
  'lucide-react',
  '@tabler/icons-react',
  'react-markdown',
  'react-shiki',
  'react-textarea-autosize',
  'remark-gfm',
  'remark-math',
  'sonner',
  'sse.js',
  'zustand',
  'immer',
  'bson',
  'idb-keyval'
]

const excludeFiles = [
  'src/components/ui/accordion.tsx',
  'src/components/ui/alert.tsx',
  'src/components/ui/aspect-ratio.tsx',
  'src/components/ui/autosize-textarea.tsx',
  'src/components/ui/avatar.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/breadcrumb.tsx',
  'src/components/ui/calendar.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/carousel.tsx',
  'src/components/ui/chart.tsx',
  'src/components/ui/checkbox.tsx',
  'src/components/ui/collapsible.tsx',
  'src/components/ui/command.tsx',
  'src/components/ui/context-menu.tsx',
  'src/components/ui/declaration-typography.tsx',
  'src/components/ui/drawer.tsx',
  'src/components/ui/form.tsx',
  'src/components/ui/hover-card.tsx',
  'src/components/ui/image-upload.tsx',
  'src/components/ui/input-otp.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/label.tsx',
  'src/components/ui/menubar.tsx',
  'src/components/ui/navigation-menu.tsx',
  'src/components/ui/pagination.tsx',
  'src/components/ui/phone-input.tsx',
  'src/components/ui/popover.tsx',
  'src/components/ui/progress.tsx',
  'src/components/ui/radio-group.tsx',
  'src/components/ui/resizable.tsx',
  'src/components/ui/scroll-area.tsx',
  'src/components/ui/select.tsx',
  'src/components/ui/separator.tsx',
  'src/components/ui/sheet.tsx',
  'src/components/ui/sidebar.tsx',
  'src/components/ui/skeleton.tsx',
  'src/components/ui/slider.tsx',
  'src/components/ui/sonner.tsx',
  'src/components/ui/switch.tsx',
  'src/components/ui/table.tsx',
  'src/components/ui/tabs.tsx',
  'src/components/ui/textarea.tsx',
  'src/components/ui/toast.tsx',
  'src/components/ui/toaster.tsx',
  'src/components/ui/toggle-group.tsx',
  'src/components/ui/toggle.tsx',
  'src/components/ui/tooltip.tsx',
  'src/components/chat/chat-header.tsx',
  'src/components/chat/chat-think.tsx',
  'src/components/chat/code-block.tsx',
  'src/components/chat/conversation-sidebar.tsx',
  'src/components/chat/floating-chat-widget.tsx',
  'src/components/chat/index.ts',
  'src/components/chat/lawyer-referral-modal.tsx',
  'src/components/chat/media-attachment.tsx',
  'src/components/chat/message-actions.tsx',
  'src/components/chat/message-bubble.tsx',
  'src/components/chat/message-editor.tsx',
  'src/components/chat/related-articles.tsx',
  'src/components/chat/scroll-to-bottom.tsx',
  'src/components/chat/suggested-replies.tsx',
  'src/components/chat/text-to-speech-button.tsx',
  'src/components/ui/shadcn-io/dropzone/index.tsx'
]

async function buildLib() {
  // ESM build
  await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/index.js',
    format: 'esm',
    platform: 'browser',
    target: 'es2018',
    external,
    sourcemap: true,
    jsx: 'preserve',
    tsconfig: 'tsconfig.json',
    treeShaking: true,
    loader: {
      '.tsx': 'tsx'
    },
    plugins: [{
      name: 'exclude-files',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (excludeFiles.some(file => args.path.includes(file))) {
            return { path: '', external: true }
          }
        })
      }
    }]
  })

  // CJS build
  await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/index.cjs',
    format: 'cjs',
    platform: 'node',
    target: 'es2018',
    external,
    sourcemap: true,
    jsx: 'preserve',
    tsconfig: 'tsconfig.json',
    treeShaking: true,
    loader: {
      '.tsx': 'tsx'
    },
    plugins: [{
      name: 'exclude-files',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (excludeFiles.some(file => args.path.includes(file))) {
            return { path: '', external: true }
          }
        })
      }
    }]
  })

  console.log('Build completed!')
}

buildLib().catch(console.error)