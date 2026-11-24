import { cn } from '@/lib/utils'

/** Skythium logo (white letters, blue wing). The header sits on the video, so it is shown on dark in both themes. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <img
      src='/images/skythium-logo.png'
      alt='Skythium'
      className={cn('h-5 w-auto select-none', className)}
      draggable={false}
    />
  )
}
