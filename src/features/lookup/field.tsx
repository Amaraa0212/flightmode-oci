import { type ComponentProps, type ReactNode } from 'react'
import { ClipboardPaste, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Dark pill input of the check-in forms, with an optional icon and paste button */
export function PillInput({
  icon,
  onPasteText,
  pasteLabel,
  className,
  ...props
}: ComponentProps<'input'> & {
  icon?: ReactNode
  onPasteText?: (text: string) => void
  pasteLabel?: string
}) {
  return (
    <div className='bg-foreground/[0.06] ring-foreground/10 flex h-12 items-center gap-2.5 rounded-full pr-2 pl-5 ring-1 focus-within:ring-2 focus-within:ring-sky-400/70'>
      {icon && <span className='text-muted-foreground shrink-0'>{icon}</span>}
      <input
        {...props}
        className={cn(
          'placeholder:text-muted-foreground/70 min-w-0 flex-1 bg-transparent text-base font-semibold outline-none',
          className
        )}
      />
      {onPasteText && (
        <button
          type='button'
          className='oci-pill flex h-9 shrink-0 items-center gap-1.5 px-3 text-xs font-bold tracking-wide text-sky-600 uppercase dark:text-sky-300'
          onClick={async () => {
            try {
              onPasteText((await navigator.clipboard.readText()).trim())
            } catch {
              // clipboard not allowed: the visitor types it
            }
          }}
        >
          <ClipboardPaste className='size-4' />
          {pasteLabel}
        </button>
      )}
    </div>
  )
}

export function FieldLabel({
  icon,
  children,
  htmlFor,
}: {
  icon?: ReactNode
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className='mb-2 flex items-center gap-2 text-xs font-bold tracking-wider uppercase'
    >
      {icon && <span className='text-sky-500 dark:text-sky-400'>{icon}</span>}
      {children}
    </label>
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className='text-muted-foreground mt-2 flex gap-2 text-xs'>
      <Info className='mt-0.5 size-4 shrink-0 text-amber-500 dark:text-amber-400' />
      {children}
    </p>
  )
}
