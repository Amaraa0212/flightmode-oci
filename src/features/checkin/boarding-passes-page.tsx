import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, PlaneTakeoff, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { checkinApi, type BoardingPass } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { session } from '@/lib/session'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorText } from '@/components/error-text'
import { ctaClass, StatusPill } from '@/components/layout'

export function BoardingPassesPage({ flightId }: { flightId: number }) {
  const { t } = useI18n()
  const passes = useQuery({
    queryKey: ['boarding-passes', flightId, session.token()],
    queryFn: () => checkinApi.boardingPasses(flightId),
  })

  return (
    <div>
      <div className='dark text-foreground mb-3 flex items-center gap-3 print:hidden'>
        <Link to='/flights' className='-ml-1 p-1' aria-label={t.back}>
          <ChevronLeft className='size-7' />
        </Link>
        <h1 className='text-xl font-bold'>{t.passTitle}</h1>
      </div>
      <div className='dark text-foreground print:hidden'>
        <StatusPill>{t.pillDone}</StatusPill>
        <p className='text-muted-foreground -mt-1 mb-4'>{t.passSubtitle}</p>
      </div>

      {passes.isPending && (
        <Skeleton className='h-[36rem] w-full rounded-[1.75rem]' />
      )}
      <ErrorText error={passes.error} />
      {passes.data?.length === 0 && (
        <p className='text-muted-foreground'>{t.noPasses}</p>
      )}

      <div className='space-y-5 print:space-y-0'>
        {passes.data?.map((pass) => (
          <PassCard key={pass.segment_id} pass={pass} />
        ))}
      </div>

      {!!passes.data?.length && (
        <button
          type='button'
          className={cn(ctaClass, 'mt-5 print:hidden')}
          onClick={() => window.print()}
        >
          <Printer className='size-5' />
          {t.print}
        </button>
      )}
    </div>
  )
}

function PassCard({ pass }: { pass: BoardingPass }) {
  const { t } = useI18n()
  const cabin = t.cabins[pass.cabin_class] ?? pass.cabin_class

  return (
    <article className='oci-card overflow-hidden print:break-after-page print:rounded-none print:border print:border-slate-300 print:bg-none'>
      <header className='border-foreground/10 bg-foreground/[0.03] flex items-center gap-3 border-b px-5 py-4'>
        <span className='flex size-10 items-center justify-center rounded-full bg-sky-400/15'>
          {pass.airline.logo_url ? (
            <img
              src={pass.airline.logo_url}
              alt=''
              className='size-6 object-contain'
            />
          ) : (
            <PlaneTakeoff className='size-5 text-sky-600 dark:text-sky-300' />
          )}
        </span>
        <div className='min-w-0'>
          <div className='truncate font-bold'>{pass.airline.name}</div>
          <div className='oci-mono text-muted-foreground text-xs'>
            PNR · {pass.pnr}
          </div>
        </div>
      </header>

      <div className='space-y-5 p-5'>
        <div className='grid grid-cols-[auto_1fr_auto] items-center gap-3'>
          <div>
            <div className='text-4xl font-extrabold tracking-tight'>
              {pass.origin.code}
            </div>
            <div className='text-muted-foreground mt-0.5 text-xs'>
              {pass.origin.city ?? pass.origin.name}
            </div>
            {pass.terminal && (
              <div className='oci-mono mt-0.5 text-xs text-sky-600 dark:text-sky-300'>
                {/^T/i.test(pass.terminal)
                  ? pass.terminal
                  : `${t.terminal} ${pass.terminal}`}
              </div>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <span className='h-px flex-1 bg-sky-400/40' />
            <PlaneTakeoff className='size-5 text-sky-500 dark:text-sky-400' />
            <span className='h-px flex-1 bg-sky-400/40' />
          </div>
          <div className='text-right'>
            <div className='text-4xl font-extrabold tracking-tight'>
              {pass.destination.code}
            </div>
            <div className='text-muted-foreground mt-0.5 text-xs'>
              {pass.destination.city ?? pass.destination.name}
            </div>
          </div>
        </div>

        <div className='divide-foreground/15 bg-foreground/[0.06] grid grid-cols-[1.4fr_1fr_1fr] divide-x rounded-full px-4 py-3'>
          <Field label={t.passenger} value={shortName(pass.passenger.name)} />
          <Field label={t.flight} value={pass.flight_number} className='pl-3' />
          <Field label={t.cabin} value={cabin} className='pl-3' accent />
        </div>
        {pass.infant && (
          <p className='text-muted-foreground -mt-2 text-sm'>
            + {t.infantWith}: {pass.infant.name}
          </p>
        )}

        <div className='grid grid-cols-3 gap-2.5'>
          <Bubble label={t.gate} value={pass.gate ?? '—'} />
          <Bubble
            label={t.boardingTime}
            value={pass.boarding_time}
            sub={`${t.departure}: ${pass.departure_time}`}
            warm
          />
          <Bubble
            label={t.seat}
            value={pass.seat_number}
            sub={pass.seat_type ? t.seatTypes[pass.seat_type] : undefined}
            accent
          />
        </div>
      </div>

      {/* tear line */}
      <div className='border-foreground/20 relative border-t border-dashed'>
        <span className='bg-background absolute top-0 -left-3 size-6 -translate-y-1/2 rounded-full print:hidden' />
        <span className='bg-background absolute top-0 -right-3 size-6 -translate-y-1/2 rounded-full print:hidden' />
      </div>

      <div className='flex flex-col items-center gap-4 p-5'>
        <div className='rounded-3xl bg-white p-4'>
          <QRCodeSVG value={pass.barcode} size={180} level='M' marginSize={1} />
        </div>
        <div className='oci-mono text-muted-foreground flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs'>
          <span>PNR: {pass.pnr}</span>
          {pass.boarding_sequence && (
            <span>
              {t.sequence}: {String(pass.boarding_sequence).padStart(3, '0')}
            </span>
          )}
          <span className='text-sky-600 dark:text-sky-300'>
            {t.date}: {pass.departure_date}
          </span>
        </div>
      </div>
    </article>
  )
}

/** "BOLD, ALDARJAVKHLAN" → "BOLD / A." (the full name is in the QR code) */
function shortName(name: string) {
  const [last = '', first = ''] = name.split(',').map((x) => x.trim())
  return first ? `${last} / ${first[0]}.` : last
}

function Field({
  label,
  value,
  className,
  accent,
}: {
  label: string
  value: string
  className?: string
  accent?: boolean
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className='oci-label text-[0.6rem]'>{label}</div>
      <div
        className={cn(
          'oci-mono truncate text-sm font-bold',
          accent && 'text-sky-600 dark:text-sky-300'
        )}
      >
        {value}
      </div>
    </div>
  )
}

function Bubble({
  label,
  value,
  sub,
  accent,
  warm,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  warm?: boolean
}) {
  return (
    <div
      className={cn(
        'bg-foreground/[0.06] flex aspect-square flex-col items-center justify-center rounded-full text-center',
        warm && 'bg-amber-400/15 ring-1 ring-amber-400/30'
      )}
    >
      <div
        className={cn(
          'oci-label text-[0.58rem]',
          warm && 'text-amber-600 dark:text-amber-300'
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          'oci-mono text-xl font-extrabold',
          accent && 'text-sky-600 dark:text-sky-300',
          warm && 'text-amber-600 dark:text-amber-300'
        )}
      >
        {value}
      </div>
      {sub && <div className='text-muted-foreground text-[0.65rem]'>{sub}</div>}
    </div>
  )
}
