import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  CircleCheck,
  Clock,
  Info,
  Plane,
  QrCode,
  Timer,
  User,
} from 'lucide-react'
import { checkinApi, type FlightSummary } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { entryPath, session } from '@/lib/session'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorText } from '@/components/error-text'
import { ctaClass, PageTitle, RouteLine, StatusPill } from '@/components/layout'

export function FlightList() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const flights = useQuery({
    queryKey: ['flights', session.token()],
    queryFn: checkinApi.flights,
  })
  const first = flights.data?.[0]

  return (
    <div>
      <StatusPill>{t.pillWindow}</StatusPill>
      <PageTitle title={t.flightsTitle} subtitle={t.flightsSubtitle} />

      <div className='space-y-4'>
        {flights.isPending && (
          <Skeleton className='h-96 w-full rounded-[1.75rem]' />
        )}
        <ErrorText error={flights.error} />
        {flights.data?.map((flight) => (
          <FlightCard key={flight.flight_id} flight={flight} />
        ))}

        {first && (
          <section className='oci-card space-y-3 p-5'>
            <p className='flex items-center gap-2 text-xs font-bold tracking-wider text-sky-600 uppercase dark:text-sky-300'>
              <Info className='size-4' />
              {t.notesTitle}
            </p>
            <p className='text-muted-foreground flex gap-3'>
              <QrCode className='mt-0.5 size-4 shrink-0' />
              {t.noteSeat}
            </p>
            <p className='text-muted-foreground flex gap-3'>
              <Timer className='mt-0.5 size-4 shrink-0 text-amber-500 dark:text-amber-400' />
              {t.noteClose(first.checkin_closes_local)}
            </p>
          </section>
        )}
      </div>

      <button
        type='button'
        className='dark text-foreground mt-5 text-sm font-semibold'
        onClick={() => {
          const to = entryPath()
          session.clear()
          navigate({ to })
        }}
      >
        {t.startAgain}
      </button>
    </div>
  )
}

function FlightCard({ flight }: { flight: FlightSummary }) {
  const { t } = useI18n()
  const anyCheckedIn = flight.passengers.some((p) => p.is_checked_in)
  const allCheckedIn = flight.passengers.every((p) => p.is_checked_in)
  const id = String(flight.flight_id)
  const cabin = flight.passengers[0]?.cabin_class

  return (
    <article className='oci-card space-y-4 p-4'>
      <div className='flex items-center justify-between gap-2'>
        <span className='oci-pill oci-mono flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-300'>
          <Plane className='size-4' />
          {flight.flight_number}
        </span>
        <span
          className={cn(
            'oci-mono flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] font-bold tracking-wider uppercase',
            allCheckedIn
              ? 'bg-emerald-400/12 text-emerald-600 dark:text-emerald-300'
              : 'bg-amber-400/12 text-amber-600 dark:text-amber-300'
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              allCheckedIn ? 'bg-emerald-400' : 'bg-amber-400'
            )}
          />
          {allCheckedIn ? t.checkedIn : t.notCheckedIn}
        </span>
      </div>

      <div className='oci-inset flex items-center gap-3 px-4 py-3'>
        <Clock className='size-5 text-sky-500 dark:text-sky-400' />
        <span className='oci-label'>{t.departure}:</span>
        <span className='oci-mono text-sm font-bold whitespace-nowrap'>
          {flight.departure_local}
        </span>
      </div>

      <RouteLine
        from={flight.origin}
        to={flight.destination}
        fromCity={flight.origin_city}
        toCity={flight.destination_city}
        middle={t.directFlight}
      />

      {(flight.aircraft_type || cabin) && (
        <div className='oci-inset divide-foreground/10 grid grid-cols-2 divide-x py-3 text-center'>
          <div>
            <div className='oci-label'>{t.aircraft}</div>
            <div className='oci-mono mt-0.5 text-sm font-bold'>
              {flight.aircraft_type ?? '—'}
            </div>
          </div>
          <div>
            <div className='oci-label'>{t.cabin}</div>
            <div className='oci-mono mt-0.5 text-sm font-bold'>
              {cabin ? (t.cabins[cabin] ?? cabin) : '—'}
            </div>
          </div>
        </div>
      )}

      <ul className='space-y-2'>
        {flight.passengers.map((p) => (
          <li
            key={p.name}
            className='oci-inset flex items-center gap-3 px-4 py-3'
          >
            <span className='bg-foreground/5 flex size-8 shrink-0 items-center justify-center rounded-full'>
              <User className='size-4 text-sky-600 dark:text-sky-300' />
            </span>
            <span className='oci-mono min-w-0 flex-1 truncate text-sm font-bold tracking-wide'>
              {p.name.replace('/', ' / ')}
            </span>
            {p.is_checked_in ? (
              <span className='flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-300'>
                <CircleCheck className='size-4' />
                {p.seat_number}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <div className='space-y-2.5'>
        {!allCheckedIn && (
          <Link
            to='/flights/$flightId'
            params={{ flightId: id }}
            className={ctaClass}
          >
            {t.checkIn}
            <ArrowRight className='size-5' />
          </Link>
        )}
        {anyCheckedIn && (
          <Link
            to='/flights/$flightId/boarding-passes'
            params={{ flightId: id }}
            className={
              allCheckedIn
                ? ctaClass
                : 'oci-pill flex h-12 w-full items-center justify-center gap-2 font-bold text-sky-600 dark:text-sky-300'
            }
          >
            <QrCode className='size-5' />
            {t.viewPass}
            {allCheckedIn && <ArrowRight className='size-5' />}
          </Link>
        )}
      </div>
    </article>
  )
}
