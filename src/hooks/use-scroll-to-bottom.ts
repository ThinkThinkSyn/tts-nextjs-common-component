import { useRef, useCallback, useEffect, useState } from "react"

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Intersection Observer to track if endRef is in view
  useEffect(() => {
    if (!containerRef.current || !endRef.current) return
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting)
      },
      {
        root: containerRef.current,
        threshold: 0.1,
      }
    )
    observer.observe(endRef.current)
    return () => observer.disconnect()
  }, [])

  // Listen to scroll events to update isAtBottom
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const threshold = 40
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
    setIsAtBottom(atBottom)
  }

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior })
    })
  }

  return { containerRef, endRef, isAtBottom, scrollToBottom, onScroll }
}
