"use client"

import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Image from 'next/image'

interface ImagePreviewModalProps {
  src: string | null
  onClose: () => void
}

export function ImagePreviewModal({ src, onClose }: ImagePreviewModalProps) {
  return (
    <Dialog open={!!src} onOpenChange={open => !open && onClose()}>
      <DialogContent className="p-0 bg-black flex items-center justify-center max-w-full max-h-full">
        <VisuallyHidden asChild>
          <DialogTitle>Image Preview</DialogTitle>
        </VisuallyHidden>
        <DialogClose asChild>
          <button
            className="absolute top-4 right-4 bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center z-[101]"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </DialogClose>
        {src && (
          <div className="flex items-center justify-center w-screen h-dvh">
            <Image
              src={src}
              alt="Preview"
              width={1920}
              height={1080}
              className="w-screen h-dvh object-contain rounded-2xl border-4 border-white shadow-2xl bg-white/10"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
