import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Armchair,
  ArrowRight,
  Baby,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Luggage,
  PlaneTakeoff,
  QrCode,
} from 'lucide-react'
import { toast } from 'sonner'
import { checkinApi, type FlightPassenger, type Seat } from '@/lib/api'
import { getEcho } from '@/lib/echo'
import { useI18n } from '@/lib/i18n'
import { session } from '@/lib/session'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorText, useErrorText } from '@/components/error-text'
import { ctaClass } from '@/components/layout'
import { SeatMap } from './seat-map'
import { useLiveSeats } from './use-live-seats'

function initials(name: string) {
  const [last = '', first = ''] = name.split('/')
  return `${last[0] ?? ''}${first[0] ?? ''}`.toUpperCase()
}

export function CheckinPage({ flightId }: { flightId: number }) {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const errorText = useErrorText()

  const passengers = useQuery({
    queryKey: ['passengers', flightId, session.token()],
    queryFn: () => checkinApi.passengers(flightId),
  })
  const seatMapKey = ['seat-map', flightId, session.token()]
  const seatMap = useQuery({
    queryKey: seatMapKey,
    queryFn: () => checkinApi.seatMap(flightId),
    // live updates come over the socket; polling covers a dropped connection and expired holds
    refetchInterval: getEcho() ? 60_000 : 20_000,
  })
  // the flight's header (route, time) comes from the session's flight list
  const flights = useQuery({
    queryKey: ['flights', session.token()],
    queryFn: checkinApi.flights,
  })
  const flight = flights.data?.find((f) => f.flight_id === flightId)
  const policies = useQuery({
    queryKey: ['policies', flightId, locale],
    queryFn: () => checkinApi.policies(flightId, locale),
  })

  const pending = useMemo(
    () => (passengers.data?.passengers ?? []).filter((p) => !p.is_checked_in),
    [passengers.data]
  )
  const done = (passengers.data?.passengers ?? []).filter(
    (p) => p.is_checked_in
  )

  // everyone not yet checked in is ticked unless the visitor unticks them
  const [unticked, setUnticked] = useState<number[]>([])
  const [picked, setPicked] = useState<Record<number, string>>({})
  const [activeId, setActiveId] = useState<number | null>(null)
  const [accepted, setAccepted] = useState(false)

  const chosen = pending.filter((p) => !unticked.includes(p.segment_id))

  // a picked seat counts only while the seat map still shows it free for us: when someone else took it
  // (socket event, reload after a failed check-in) the passenger simply has no seat chosen again
  const free = new Set(
    (seatMap.data?.seats ?? [])
      .filter((s) => s.state === 'available')
      .map((s) => s.seat_number)
  )
  const seats: Record<number, string> = {}
  for (const [id, seat] of Object.entries(picked))
    if (free.has(seat)) seats[Number(id)] = seat
  // seats being claimed: added before the hold request so its own "held" broadcast is not taken for someone else's
  const claiming = useRef(new Set<string>())
  useLiveSeats(
    flightId,
    seatMapKey,
    (seat) => claiming.current.has(seat) || Object.values(picked).includes(seat)
  )
  const active = chosen.find((p) => p.segment_id === activeId) ?? chosen[0]

  const mine: Record<string, string> = {}
  for (const p of chosen)
    if (seats[p.segment_id]) mine[seats[p.segment_id]] = initials(p.name)

  const hold = useMutation({
    mutationFn: ({ seat }: { seat: Seat; passenger: FlightPassenger }) =>
      checkinApi.holdSeat(flightId, seat.seat_number),
    onSuccess: (_, { seat, passenger }) => {
      const previous = picked[passenger.segment_id]
      if (previous && previous !== seat.seat_number)
        checkinApi.releaseSeat(flightId, previous)
      setPicked((prev) => ({
        ...prev,
        [passenger.segment_id]: seat.seat_number,
      }))
      const next = chosen.find(
        (p) => p.segment_id !== passenger.segment_id && !seats[p.segment_id]
      )
      if (next) setActiveId(next.segment_id)
    },
    onError: (error) => {
      toast.error(errorText(error))
      queryClient.invalidateQueries({ queryKey: ['seat-map', flightId] })
    },
  })

  const release = (id: number) => {
    const seat = picked[id]
    if (seat) checkinApi.releaseSeat(flightId, seat)
    setPicked(({ [id]: _, ...rest }) => rest)
  }

  const checkIn = useMutation({
    mutationFn: () =>
      checkinApi.checkIn(
        flightId,
        chosen.map((p) => ({
          segment_id: p.segment_id,
          seat_number: seats[p.segment_id] ?? null,
        }))
      ),
    onSuccess: (passes) => {
      toast.success(t.checkedInOk)
      queryClient.setQueryData(
        ['boarding-passes', flightId, session.token()],
        passes
      )
      queryClient.invalidateQueries({ queryKey: ['flights'] })
      queryClient.invalidateQueries({ queryKey: ['passengers', flightId] })
      navigate({
        to: '/flights/$flightId/boarding-passes',
        params: { flightId: String(flightId) },
      })
    },
    // a seat may have been taken meanwhile: the fresh map drops it from the choice
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['seat-map', flightId] })
      queryClient.invalidateQueries({ queryKey: ['passengers', flightId] })
    },
  })

  const pickSeat = (seat: Seat) => {
    if (!active) return
    if (seats[active.segment_id] === seat.seat_number) {
      release(active.segment_id)
      return
    }
    claiming.current.add(seat.seat_number)
    hold.mutate(
      { seat, passenger: active },
      { onSettled: () => claiming.current.delete(seat.seat_number) }
    )
  }

  const toggle = (id: number, on: boolean) => {
    setUnticked((prev) => (on ? prev.filter((x) => x !== id) : [...prev, id]))
    if (!on) release(id)
  }

  if (passengers.isPending)
    return <Skeleton className='h-96 w-full rounded-[1.75rem]' />
  if (passengers.error) return <ErrorText error={passengers.error} />

  const policyList = [
    ...(policies.data?.cabin ?? []),
    ...(policies.data?.checked ?? []),
  ]
  const activeSeat = active
    ? seatMap.data?.seats.find(
        (s) => s.seat_number === seats[active.segment_id]
      )
    : undefined

  return (
    <div className='space-y-4'>
      <div className='dark text-foreground flex items-center gap-3'>
        <Link to='/flights' className='-ml-1 p-1' aria-label={t.back}>
          <ChevronLeft className='size-7' />
        </Link>
        <h1 className='text-xl font-bold'>{t.seatSelectTitle}</h1>
      </div>

      {flight && (
        <section className='oci-card space-y-3 p-4'>
          <div className='flex items-center justify-between gap-2'>
            <span className='oci-mono rounded-lg bg-sky-500 px-2 py-0.5 text-sm font-bold text-[#06162a]'>
              {flight.flight_number}
            </span>
            {flight.aircraft_type && (
              <span className='oci-label'>{flight.aircraft_type}</span>
            )}
          </div>
          <div className='flex items-end justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <div>
                <div className='text-2xl font-extrabold'>{flight.origin}</div>
                <div className='text-muted-foreground text-xs'>
                  {flight.origin_city}
                </div>
              </div>
              <PlaneTakeoff className='size-5 text-sky-500 dark:text-sky-400' />
              <div>
                <div className='text-2xl font-extrabold'>
                  {flight.destination}
                </div>
                <div className='text-muted-foreground text-xs'>
                  {flight.destination_city}
                </div>
              </div>
            </div>
            <div className='text-right'>
              <div className='oci-label'>{t.departure}</div>
              <div className='oci-mono text-base font-bold text-sky-600 dark:text-sky-300'>
                {flight.departure_local.slice(11)}
              </div>
              <div className='oci-mono text-muted-foreground text-xs'>
                {flight.departure_local.slice(0, 10)}
              </div>
            </div>
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section className='oci-card flex flex-wrap items-center justify-between gap-3 p-4'>
          <div className='space-y-1'>
            {done.map((p) => (
              <div key={p.segment_id} className='flex items-center gap-2'>
                <CheckCircle2 className='size-4 text-emerald-600 dark:text-emerald-400' />
                <span className='oci-mono font-bold'>{p.name}</span>
                <span className='oci-mono text-sky-600 dark:text-sky-300'>
                  {p.seat_number}
                </span>
              </div>
            ))}
          </div>
          <Link
            to='/flights/$flightId/boarding-passes'
            params={{ flightId: String(flightId) }}
            className='oci-pill flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-sky-600 dark:text-sky-300'
          >
            <QrCode className='size-4' />
            {t.boardingPasses}
          </Link>
        </section>
      )}

      {pending.length > 0 && (
        <>
          <div className='space-y-2'>
            {pending.map((p, index) => {
              const isOn = !unticked.includes(p.segment_id)
              const isActive = isOn && active?.segment_id === p.segment_id
              return (
                <div
                  key={p.segment_id}
                  className={cn(
                    'oci-card flex items-center gap-3 p-4 transition',
                    isActive && 'ring-2 ring-sky-400/60'
                  )}
                >
                  <Checkbox
                    checked={isOn}
                    onCheckedChange={(v) => toggle(p.segment_id, v === true)}
                    aria-label={p.name}
                  />
                  <button
                    type='button'
                    className='flex min-w-0 flex-1 items-center justify-between gap-3 text-left'
                    disabled={!isOn}
                    onClick={() => setActiveId(p.segment_id)}
                  >
                    <span className='min-w-0'>
                      <span className='oci-label block'>
                        {t.passengerN(index + 1)}
                      </span>
                      <span className='oci-mono block truncate text-sm font-bold'>
                        {p.name.replace('/', ' / ')}
                      </span>
                      {p.infant && (
                        <span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>
                          <Baby className='size-3' />
                          {t.infantWith}: {p.infant}
                        </span>
                      )}
                    </span>
                    {isOn && (
                      <span className='shrink-0 rounded-2xl bg-sky-400/10 px-3 py-1.5 text-center'>
                        <span className='oci-label block text-[0.6rem]'>
                          {t.seatSelected}
                        </span>
                        <span className='oci-mono block text-base font-bold text-sky-600 dark:text-sky-300'>
                          {seats[p.segment_id] ?? p.seat_number ?? '—'}
                        </span>
                      </span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {active && (
            <section className='oci-card space-y-3 p-3'>
              <p className='text-muted-foreground px-1 text-sm'>{t.autoSeat}</p>
              {seatMap.isPending && (
                <Skeleton className='h-80 w-full rounded-2xl' />
              )}
              <ErrorText error={seatMap.error} />
              {seatMap.data && (
                <SeatMap
                  map={seatMap.data}
                  mine={mine}
                  active={seats[active.segment_id]}
                  onPick={pickSeat}
                  disabled={hold.isPending}
                />
              )}
            </section>
          )}

          {activeSeat && (
            <section className='oci-card flex items-center justify-between p-4'>
              <span className='flex items-center gap-2 text-base font-bold'>
                <Armchair className='size-5 text-sky-500 dark:text-sky-400' />
                {activeSeat.seat_number}
              </span>
              <span className='oci-pill px-3 py-1 text-sm font-semibold text-sky-600 dark:text-sky-300'>
                {t.seatTypes[activeSeat.seat_type] ?? activeSeat.seat_type}
              </span>
            </section>
          )}

          <section className='oci-card space-y-3 p-4'>
            <h2 className='flex items-center gap-2 text-base font-bold'>
              <Luggage className='size-5 text-sky-500 dark:text-sky-400' />
              {t.policiesTitle}
            </h2>
            {policyList.map((policy) => (
              <details key={policy.id} className='oci-inset p-4'>
                <summary className='cursor-pointer font-semibold'>
                  {policy.title}
                </summary>
                {/* policy texts are written by the airline in the admin's rich-text editor */}
                <div
                  className='text-muted-foreground mt-2 max-w-none text-sm'
                  dangerouslySetInnerHTML={{ __html: policy.body }}
                />
              </details>
            ))}
            <label className='oci-inset flex items-start gap-3 p-4'>
              <Checkbox
                className='mt-0.5'
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
              />
              <span>{t.acceptPolicies}</span>
            </label>
          </section>

          <ErrorText error={checkIn.error} />
          {chosen.length === 0 && (
            <p className='text-muted-foreground text-sm'>
              {t.noPassengerSelected}
            </p>
          )}

          {/* sticky confirm bar above the bottom navigation */}
          <div className='bg-background/95 border-foreground/10 fixed inset-x-0 bottom-16 z-10 border-t backdrop-blur'>
            <div className='mx-auto flex max-w-xl items-center gap-4 px-4 py-3'>
              <div className='shrink-0'>
                <div className='oci-label'>{t.seat}</div>
                <div className='oci-mono text-xl font-bold text-sky-600 dark:text-sky-300'>
                  {active ? (seats[active.segment_id] ?? '—') : '—'}
                </div>
              </div>
              <button
                type='button'
                className={cn(ctaClass, 'h-12 text-sm')}
                disabled={!accepted || chosen.length === 0 || checkIn.isPending}
                onClick={() => checkIn.mutate()}
              >
                {checkIn.isPending && <Loader2 className='animate-spin' />}
                {t.confirmCheckIn}
                {!checkIn.isPending && <ArrowRight className='size-5' />}
              </button>
            </div>
          </div>
          <div className='h-20' />
        </>
      )}
    </div>
  )
}
