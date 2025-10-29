import React, { FC, memo } from "react"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { MessageCodeBlock } from "./message-codeblock"
import { MarkdownMemoized } from "./markdown-memorized"
import Image from "next/image"

interface MessageMarkdownProps {
  content: string
}

export const MessageMarkdown: FC<MessageMarkdownProps> = ({ content }) => {
  return (
    <MarkdownMemoized
      className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none space-y-6 break-words overflow-wrap-anywhere w-full"
      remarkPlugins={[remarkGfm, remarkMath]}
      components={{
        p({ children }: { children: React.ReactNode }) {
          return (
            <p className="mb-2 last:mb-0 break-words overflow-wrap-anywhere">
              {children}
            </p>
          )
        },
        img({
          node,
          src,
          alt,
          ...props
        }: {
          node?: any
          src?: string
          alt?: string
          [key: string]: any
        }) {
          return (
            <Image
              className="max-w-[67%] h-auto break-inside-avoid"
              src={src || ""}
              alt={alt || ""}
              width={400}
              height={300}
              {...props}
            />
          )
        },
        code({
          node,
          className,
          children,
          ...props
        }: {
          node?: any
          className?: string
          children: React.ReactNode
          [key: string]: any
        }) {
          const childArray = React.Children.toArray(children)
          const firstChild = childArray[0] as React.ReactElement
          const firstChildAsString = React.isValidElement(firstChild)
            ? (firstChild.props as { children?: React.ReactNode }).children
            : (firstChild as unknown as string)

          if (firstChildAsString === "▍") {
            return <span className="mt-1 animate-pulse cursor-default">▍</span>
          }

          if (typeof firstChildAsString === "string") {
            childArray[0] = firstChildAsString.replace("`▍`", "▍")
          }

          const match = /language-(\w+)/.exec(className || "")

          if (
            typeof firstChildAsString === "string" &&
            !firstChildAsString.includes("\n")
          ) {
            return (
              <code
                className={`${className} break-words overflow-wrap-anywhere`}
                {...props}
              >
                {childArray}
              </code>
            )
          }

          return (
            <MessageCodeBlock
              key={Math.random()}
              language={(match && match[1]) || ""}
              value={String(childArray).replace(/\n$/, "")}
              {...props}
            />
          )
        },
      }}
    >
      {content}
    </MarkdownMemoized>
  )
}
