import { type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Moon, PlaneTakeoff, Sun, TicketsPlane, UserCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { entryPath, session } from '@/lib/session'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { Wordmark } from './logo'

export function Shell({ children }: { children: ReactNode }) {
  const { locale, toggle } = useI18n()
  const [theme, toggleTheme] = useTheme()
  const path = useRouterState({ select: (s) => s.location.pathname })
  const ot = path === '/ot' || session.get()?.entry === 'ot'

  return (
    <div className='flex min-h-svh flex-col'>
      <BackgroundVideo />
      {/* the top sits on the video: dark styling in both themes */}
      <header className='dark text-foreground relative z-20 print:hidden'>
        <div className='mx-auto flex h-14 max-w-xl items-center justify-between px-4'>
          <Link to={entryPath()} className='flex items-center gap-2'>
            <Wordmark className='h-5' />
            {ot && (
              <span className='oci-mono rounded-full bg-sky-400/15 px-2 py-0.5 text-[0.65rem] font-semibold text-sky-600 dark:text-sky-300'>
                OT
              </span>
            )}
          </Link>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={toggle}
              className='oci-pill oci-mono h-9 px-3 text-[0.7rem] tracking-wider'
              aria-label='Language'
            >
              <span
                className={
                  locale === 'mn'
                    ? 'text-foreground font-bold'
                    : 'text-muted-foreground'
                }
              >
                MN
              </span>
              <span className='text-muted-foreground'> / </span>
              <span
                className={
                  locale === 'en'
                    ? 'text-foreground font-bold'
                    : 'text-muted-foreground'
                }
              >
                EN
              </span>
            </button>
            <button
              type='button'
              onClick={toggleTheme}
              className='oci-pill flex size-9 items-center justify-center'
              aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className='size-4' />
              ) : (
                <Moon className='size-4' />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className='mx-auto w-full max-w-xl flex-1 px-4 pt-2 pb-24 print:p-0'>
        {children}
      </main>

      <BottomNav />
    </div>
  )
}

/**
 * Sky loop behind every page, under a theme-coloured veil so the cards and text stay readable.
 * Left out for "reduce motion" and on paper.
 */
function BackgroundVideo() {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden'
    >
      <video
        className='size-full object-cover object-right motion-reduce:hidden'
        src='/videos/sky-wing-loop.mp4'
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
      />
      <div className='dark:from-background/25 dark:via-background/50 dark:to-background/90 absolute inset-0 hidden dark:block dark:bg-gradient-to-b' />
    </div>
  )
}

function BottomNav() {
  const { t } = useI18n()
  const path = useRouterState({ select: (s) => s.location.pathname })
  const hasSession = !!session.token()
  const onFlights = path.startsWith('/flights')

  const item = (active: boolean, icon: ReactNode, label: string) => (
    <span
      className={cn(
        'flex flex-col items-center gap-0.5 text-[0.62rem] font-semibold tracking-wider uppercase',
        active ? 'text-sky-400' : 'text-foreground'
      )}
    >
      {icon}
      {label}
    </span>
  )

  return (
    <nav className='dark text-foreground bg-background/8 border-foreground/10 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur print:hidden'>
      <div className='mx-auto grid h-16 max-w-xl grid-cols-2 items-center px-4 pb-[env(safe-area-inset-bottom)]'>
        <Link to={entryPath()}>
          {item(!onFlights, <UserCheck className='size-5' />, t.navCheckin)}
        </Link>
        {hasSession ? (
          <Link to='/flights'>
            {item(onFlights, <TicketsPlane className='size-5' />, t.navFlights)}
          </Link>
        ) : (
          <span className='opacity-40'>
            {item(false, <TicketsPlane className='size-5' />, t.navFlights)}
          </span>
        )}
      </div>
    </nav>
  )
}

/** Small status line under the header: "● ONLINE CHECK-IN WINDOW: OPEN" */
export function StatusPill({
  children,
  tone = 'ok',
}: {
  children: ReactNode
  tone?: 'ok' | 'wait'
}) {
  return (
    <div className='dark text-foreground oci-pill oci-mono bg-background/70 mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 text-[0.62rem] tracking-[0.12em] uppercase backdrop-blur'>
      <span
        className={cn(
          'size-2 rounded-full',
          tone === 'ok' ? 'bg-emerald-400' : 'bg-amber-400'
        )}
      />
      <span
        className={
          tone === 'ok'
            ? 'text-emerald-600 dark:text-emerald-300'
            : 'text-amber-600 dark:text-amber-300'
        }
      >
        {children}
      </span>
    </div>
  )
}

export function PageTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className='dark text-foreground mb-5 print:hidden'>
      <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
      {subtitle && (
        <p className='text-foreground/70 mt-1 text-sm'>{subtitle}</p>
      )}
    </div>
  )
}

/** Big IATA codes with the line and plane between them */
export function RouteLine({
  from,
  to,
  fromCity,
  toCity,
  middle,
  size = 'lg',
}: {
  from: string
  to: string
  fromCity?: string | null
  toCity?: string | null
  middle?: ReactNode
  size?: 'lg' | 'md'
}) {
  const code = size === 'lg' ? 'text-4xl' : 'text-3xl'
  return (
    <div className='grid grid-cols-[auto_1fr_auto] items-center gap-3'>
      <div>
        <div className={cn(code, 'font-extrabold tracking-tight')}>{from}</div>
        {fromCity && (
          <div className='text-muted-foreground mt-0.5 text-xs'>{fromCity}</div>
        )}
      </div>
      <div className='flex flex-col items-center gap-1.5'>
        <div className='flex w-full items-center gap-2'>
          <span className='h-px flex-1 bg-sky-400/40' />
          <PlaneTakeoff className='size-5 text-sky-500 dark:text-sky-400' />
          <span className='h-px flex-1 bg-sky-400/40' />
        </div>
        {middle && (
          <div className='oci-mono text-center text-[0.68rem] tracking-wider text-sky-600 uppercase dark:text-sky-300'>
            {middle}
          </div>
        )}
      </div>
      <div className='text-right'>
        <div
          className={cn(
            code,
            'font-extrabold tracking-tight text-sky-500 dark:text-sky-400'
          )}
        >
          {to}
        </div>
        {toCity && (
          <div className='text-muted-foreground mt-0.5 text-xs'>{toCity}</div>
        )}
      </div>
    </div>
  )
}

/** The big gradient call to action */
export const ctaClass =
  'oci-cta flex h-12 w-full items-center justify-center gap-2 text-base disabled:opacity-50'
